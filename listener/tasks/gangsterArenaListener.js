import { Contract } from '@ethersproject/contracts';
import { formatEther } from '@ethersproject/units';

import GangsterArenaABI from '../assets/abis/GameContract.json' assert { type: 'json' };
import GangsterABI from '../assets/abis/NFT.json' assert { type: 'json' };
import admin, { firestore } from '../configs/firebase.config.js';
import provider from '../configs/provider.config.js';
import environments from '../utils/environments.js';
import logger from '../utils/logger.js';
import { GangsterEvent } from '../utils/constants.js';
import { getActiveSeason, getActiveSeasonId } from '../services/season.service.js';

const { NETWORK_ID } = environments;

const MAX_RETRY = 3;

const gangsterArenaListener = async () => {
  const activeSeason = await getActiveSeason();
  const { gameAddress: GAME_CONTRACT_ADDRESS, nftAddress: NFT_ADDRESS } = activeSeason || {};
  logger.info(`Start listen contract ${GAME_CONTRACT_ADDRESS} on Network ${NETWORK_ID}`);
  const contract = new Contract(GAME_CONTRACT_ADDRESS, GangsterArenaABI.abi, provider);
  const nftContract = new Contract(NFT_ADDRESS, GangsterABI.abi, provider);

  contract.on(GangsterEvent.BuyGangster, async (to, tokenId, amount, nonce, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).set({ lastBlock: event.blockNumber });
    await processMintEvent({ to, tokenId, amount, nonce, event, contract, nftContract });
  });

  contract.on(GangsterEvent.Deposit, async (from, to, amount, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).set({ lastBlock: event.blockNumber });
    await processDepositEvent({ from, to, amount, event, contract, nftContract });
  });

  contract.on(GangsterEvent.Withdraw, async (from, to, amount, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).set({ lastBlock: event.blockNumber });
    await processWithdrawEvent({ from, to, amount, event, contract, nftContract });
  });

  contract.on(GangsterEvent.Burn, async (from, to, amount, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).set({ lastBlock: event.blockNumber });
    for (let i = 0; i < from.length; i++) {
      await processBurnEvent({ from: from[i], to: to[i], amount: amount[i], event, contract, nftContract });
    }
  });

  contract.on(GangsterEvent.BuyGoon, async (to, amount, nonce, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).set({ lastBlock: event.blockNumber });
    await processBuyGoonEvent({ to, amount, nonce, event, contract });
  });
  contract.on(GangsterEvent.BuySafeHouse, async (to, amount, nonce, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).set({ lastBlock: event.blockNumber });
    await processBuySafeHouseEvent({ to, amount, nonce, event, contract });
  });

  contract.on(GangsterEvent.Retire, async (to, amount, nonce, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).set({ lastBlock: event.blockNumber });
    await processRetireEvent({ to, amount, nonce, event, contract });
  });
};

const processMintEvent = async ({ to, tokenId, amount, nonce, event, contract, nftContract }) => {
  try {
    logger.info('NFT minted');
    logger.info({ to, tokenId, amount, nonce, event });
    const { transactionHash } = event;

    // need to update txn, season, user, referrer, gamePlay, warDeployment
    const batch = firestore.batch();

    const user = await getUserFromAddress(to);
    if (!user) return;

    const activeSeason = await getActiveSeason();
    const {
      referralConfig,
      estimatedEndTime,
      endTimeConfig: { timeIncrementInSeconds },
    } = activeSeason;

    const txnSnapshot = await firestore
      .collection('transaction')
      .where('nonce', '==', Number(nonce.toString()))
      .limit(1)
      .get();

    if (txnSnapshot.empty) return;

    const txn = txnSnapshot.docs[0];
    const { isMintWhitelist, referrerAddress, referralDiscount } = txn.data();

    // update txn
    batch.update(txn.ref, { status: 'Success', txnHash: transactionHash });

    // update season
    const estimatedEndTimeUnix = estimatedEndTime.toDate().getTime();
    const newEndTimeUnix = calculateNewEstimatedEndTimeUnix(estimatedEndTimeUnix, amount, timeIncrementInSeconds);

    const seasonRef = firestore.collection('season').doc(activeSeason.id);
    batch.update(seasonRef, {
      estimatedEndTime: admin.firestore.Timestamp.fromMillis(newEndTimeUnix),
      machineSold: admin.firestore.FieldValue.increment(amount),
      rankPrizePool: Number(parseFloat(formatEther(prizePool)).toFixed(6)),
      reputationPrizePool: Number(parseFloat(formatEther(retirePool)).toFixed(6)),
    });

    // update user && referrer
    if (referrerAddress) {
      const currentDiscount = user.data().referralTotalDiscount;
      const referralTotalDiscount = currentDiscount
        ? admin.firestore.FieldValue.increment(referralDiscount)
        : referralDiscount;

      batch.update(user.ref, { referralTotalDiscount });

      const referrerSnapshot = await firestore
        .collection('user')
        .where('address', '==', referrerAddress)
        .limit(1)
        .get();

      if (!referrerSnapshot.empty) {
        const reward = getAccurate(value * referralConfig.referralBonus, 7);
        const userCurrentReward = referrerSnapshot.docs[0].data().referralTotalReward;
        const referralTotalReward = userCurrentReward ? admin.firestore.FieldValue.increment(reward) : reward;

        batch.update(referrerSnapshot.docs[0].ref, { referralTotalReward });
      }
    }

    // update gamePlay && warDeployment
    const { gamePlayId, gamePlay, warDeploymentId, warDeployment } = await getUserNewMachines({
      userId: user.id,
      nftContract,
    });

    if (isMintWhitelist) {
      gamePlay.whitelistAmountMinted = admin.firestore.FieldValue.increment(amount);
    }

    if (gamePlayId) {
      const gamePlayRef = firestore.collection('gamePlay').doc(gamePlayId);
      batch.update(gamePlayRef, { ...gamePlay, active: true });
    }

    if (warDeploymentId) {
      const warDeploymentRef = firestore.collection('warDeployment').doc(warDeploymentId);
      batch.update(warDeploymentRef, warDeployment);
    }

    let retry = 0;
    let isSuccess = false;
    while (retry < MAX_RETRY && !isSuccess) {
      try {
        logger.info(
          `Start processMintEvent. Retry ${retry++} times. ${JSON.stringify({ to, tokenId, amount, nonce, event })}`
        );
        await batch.commit();
        isSuccess = true;
      } catch (err) {
        logger.error(`Unsuccessful processMintEvent txn: ${JSON.stringify(err)}`);
      }
    }
  } catch (err) {
    logger.error(err);
  }
};

const processRetireEvent = async ({ to, amount, nonce, event, contract }) => {
  try {
    logger.info('NFT minted');
    logger.info({ to, amount, nonce, event });

    await updateNumberOfGangster({
      address: to.toLowerCase(),
      newBalance: 0,
      active: false,
    });
    // TODO: update separate fields: rankPrizePool, reputationPrizePool, burnValue, devFee
    const prizePool = await contract.getPrizeBalance();
    await updatePrizePool(parseFloat(formatEther(prizePool)).toFixed(6));

    const retirePool = await contract.getRetireBalance();
    await updateReputationPool(parseFloat(formatEther(retirePool)).toFixed(6));
  } catch (err) {
    logger.error(err);
  }
};

const processDepositEvent = async ({ from, to, amount, event, contract, nftContract }) => {
  try {
    logger.info('process deposit event');
    logger.info({ from, to, amount, event });
    const { transactionHash } = event;

    await createTransaction({
      address: from.toLowerCase(),
      type: 'deposit-machine',
      txnHash: transactionHash,
      token: 'Machine',
      amount: Number(amount.toString()),
      status: 'Success',
      value: 0,
    });

    const gangsterNumber = await nftContract.gangster(from);
    const newBalance = gangsterNumber.toString();
    await updateNumberOfGangster({
      address: from.toLowerCase(),
      newBalance,
    });
  } catch (err) {
    logger.error(err);
  }
};

const processWithdrawEvent = async ({ from, to, amount, event, contract, nftContract }) => {
  try {
    logger.info('process withdraw event');
    logger.info({ from, to, amount, event });
    const { transactionHash } = event;

    await createTransaction({
      address: from.toLowerCase(),
      type: 'withdraw-machine',
      txnHash: transactionHash,
      token: 'Machine',
      amount: Number(amount.toString()),
      status: 'Success',
      value: 0,
    });

    const gangsterNumber = await nftContract.gangster(from);
    const newBalance = gangsterNumber.toString();
    await updateNumberOfGangster({
      address: from.toLowerCase(),
      newBalance,
    });
  } catch (err) {
    logger.error(err);
  }
};

const processBurnEvent = async ({ from, to, amount, event, contract, nftContract }) => {
  try {
    logger.info('process event');
    logger.info({ from, to, amount, event });
    const { transactionHash } = event;

    // handle in backend
  } catch (err) {
    logger.error(err);
  }
};

const processBuyGoonEvent = async ({ to, amount, nonce, event, contract }) => {
  try {
    logger.info('process event');
    logger.info({ to, amount, nonce, event });
    const { transactionHash } = event;

    // need to update txn, season, gamePlay, user, worker-txn-prices
    const batch = firestore.batch();

    const user = await getUserFromAddress(to);
    if (!user) return;

    const txnSnapshot = await firestore
      .collection('transaction')
      .where('nonce', '==', Number(nonce.toString()))
      .limit(1)
      .get();

    if (txnSnapshot.empty) return;

    const txn = txnSnapshot.docs[0];

    const activeSeasonId = await getActiveSeasonId();
    const gamePlay = await getUserActiveGamePlay(user.id);

    // update txn
    batch.update(txn.ref, { status: 'Success', txnHash: transactionHash });

    // update season
    const seasonRef = firestore.collection('season').doc(activeSeasonId);
    batch.update(seasonRef, { workerSold: admin.firestore.FieldValue.increment(amount) });

    // update gamePlay
    const generatedXToken = await calculateGeneratedXToken(user.id);
    const gamePlayRef = firestore.collection('gamePlay').doc(gamePlay.id);
    batch.update(gamePlayRef, {
      numberOfWorkers: admin.firestore.FieldValue.increment(amount),
      startXTokenCountingTime: admin.firestore.FieldValue.serverTimestamp(),
    });

    // update user xTokenBalance
    batch.update(user.ref, { xTokenBalance: admin.firestore.FieldValue.increment(generatedXToken) });

    // update worker-txn-price
    const { createdAt, prices } = txn;
    const workerTxnPriceRef = firestore.collection('worker-txn-prices').doc(txn.id);
    batch.set(workerTxnPriceRef, {
      txnId: txn.id,
      createdAt,
      avgPrice: prices.length > 0 ? value / prices.length : 0,
      seasonId: activeSeasonId,
    });

    let retry = 0;
    let isSuccess = false;

    while (retry < MAX_RETRY && !isSuccess) {
      try {
        logger.info(`Start processBuyGoon. Retry ${retry++} times. ${JSON.stringify({ to, amount, nonce, event })}`);
        await batch.commit();
        isSuccess = true;
      } catch (err) {
        logger.error(`Unsuccessful processBuyGoon txn: ${JSON.stringify(err)}`);
      }
    }
  } catch (err) {
    logger.error(err);
  }
};

const processBuySafeHouseEvent = async ({ to, amount, nonce, event, contract }) => {
  try {
    logger.info('process event');
    logger.info({ to, amount, nonce, event });
    const { transactionHash } = event;
    console.log(Number(nonce.toString()));
    await increaseSafeHouse({ address: to, amount: Number(amount.toString()) });
    // handle in backend
    const txn = await firestore.collection('transaction').where('nonce', '==', Number(nonce.toString())).limit(1).get();
    if (!txn.empty) {
      const txnId = txn.docs[0].id;
      const txnData = txn.docs[0].data();
      await firestore.collection('transaction').doc(txnId).update({
        status: 'Success',
        txnHash: transactionHash,
      });

      const { prices, value, seasonId, createdAt } = txnData;
      await firestore
        .collection('building-txn-prices')
        .doc(txnId)
        .set({
          txnId,
          createdAt: createdAt,
          avgPrice: prices.length > 0 ? value / prices.length : 0,
          seasonId: seasonId,
        });
    }
  } catch (err) {
    logger.error(err);
  }
};

const createTransaction = async ({ address, ...data }) => {
  const system = await firestore.collection('system').doc('default').get();
  const { activeSeasonId } = system.data();

  const user = await firestore.collection('user').where('address', '==', address).limit(1).get();
  if (!user.empty) {
    await firestore.collection('transaction').add({
      userId: user.docs[0].id,
      seasonId: activeSeasonId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...data,
    });
  }
};

const getUserNewMachines = async ({ userId, nftContract }) => {
  const gangsterNumber = await nftContract.gangster(to);
  const newBalance = Number(gangsterNumber.toString());

  const gamePlay = await getUserActiveGamePlay(userId);
  if (!gamePlay) return { gamePlay: {}, warDeployment: {} };

  const { numberOfMachines } = gamePlay.data();
  const now = Date.now();
  const generatedReward = await calculateGeneratedReward(user.docs[0].id);

  const warDeploymentSnapshot = await admin
    .firestore()
    .collection('warDeployment')
    .where('userId', '==', user.docs[0].id)
    .where('seasonId', '==', gamePlay.seasonId)
    .limit(1)
    .get();
  if (warDeploymentSnapshot.empty)
    return {
      gamePlayId: gamePlay.id,
      warDeploymentId: null,
      gamePlay: {
        numberOfMachines: newNumberOfMachines,
        startRewardCountingTime: admin.firestore.Timestamp.fromMillis(now),
        pendingReward: admin.firestore.FieldValue.increment(generatedReward),
      },
      warDeployment: {},
    };

  const warDeployment = { id: gamePlaySnapshot.docs[0].id, ...warDeploymentSnapshot.docs[0].data() };

  const newNumberOfMachines = Number(newBalance);
  let numberOfMachinesToEarn = warDeployment.numberOfMachinesToEarn;
  let numberOfMachinesToAttack = warDeployment.numberOfMachinesToAttack;
  let numberOfMachinesToDefend = warDeployment.numberOfMachinesToDefend;

  // when mint, deposit --> increasement is added to machinesToEarn
  if (newNumberOfMachines > numberOfMachines) {
    numberOfMachinesToDefend = Math.min(numberOfMachinesToDefend, newNumberOfMachines);
    numberOfMachinesToAttack = Math.max(
      0,
      Math.min(numberOfMachinesToAttack, newNumberOfMachines - numberOfMachinesToDefend)
    );
    numberOfMachinesToEarn = Math.max(0, newNumberOfMachines - numberOfMachinesToDefend - numberOfMachinesToAttack);
  }

  // when withdraw --> withdraw order: attack -> defend -> earn
  if (newNumberOfMachines < numberOfMachines) {
    numberOfMachinesToEarn = Math.min(numberOfMachinesToEarn, newNumberOfMachines);
    numberOfMachinesToDefend = Math.max(
      0,
      Math.min(numberOfMachinesToDefend, newNumberOfMachines - numberOfMachinesToEarn)
    );
    numberOfMachinesToAttack = Math.max(0, newNumberOfMachines - numberOfMachinesToDefend - numberOfMachinesToEarn);
  }

  return {
    gamePlayId: gamePlay.id,
    warDeploymentId: warDeployment.id,
    gamePlay: {
      numberOfMachines: newNumberOfMachines,
      startRewardCountingTime: admin.firestore.Timestamp.fromMillis(now),
      pendingReward: admin.firestore.FieldValue.increment(generatedReward),
    },
    warDeployment: {
      numberOfMachinesToEarn,
      numberOfMachinesToAttack,
      numberOfMachinesToDefend,
    },
  };
};

const updateNumberOfGangster = async ({ address, newBalance, active = false }) => {
  logger.info({ address, newBalance: Number(newBalance) });
  const activeSeasonId = await getActiveSeasonId();
  const user = await firestore.collection('user').where('address', '==', address).limit(1).get();
  if (!user.empty) {
    const gamePlaySnapshot = await firestore
      .collection('gamePlay')
      .where('userId', '==', user.docs[0].id)
      .where('seasonId', '==', activeSeasonId)
      .limit(1)
      .get();
    if (!gamePlaySnapshot.empty) {
      const gamePlay = gamePlaySnapshot.docs[0];
      const { numberOfMachines } = gamePlay.data();
      const now = Date.now();
      const generatedReward = await calculateGeneratedReward(user.docs[0].id);

      const warDeploymentSnapshot = await admin
        .firestore()
        .collection('warDeployment')
        .where('userId', '==', user.docs[0].id)
        .where('seasonId', '==', activeSeasonId)
        .limit(1)
        .get();
      if (warDeploymentSnapshot.empty) return;

      const warDeployment = warDeploymentSnapshot.docs[0].data();

      const newNumberOfMachines = Number(newBalance);
      let numberOfMachinesToEarn = warDeployment.numberOfMachinesToEarn;
      let numberOfMachinesToAttack = warDeployment.numberOfMachinesToAttack;
      let numberOfMachinesToDefend = warDeployment.numberOfMachinesToDefend;

      // when mint, deposit --> increasement is added to machinesToEarn
      if (newNumberOfMachines > numberOfMachines) {
        numberOfMachinesToDefend = Math.min(numberOfMachinesToDefend, newNumberOfMachines);
        numberOfMachinesToAttack = Math.max(
          0,
          Math.min(numberOfMachinesToAttack, newNumberOfMachines - numberOfMachinesToDefend)
        );
        numberOfMachinesToEarn = Math.max(0, newNumberOfMachines - numberOfMachinesToDefend - numberOfMachinesToAttack);
      }

      // when withdraw --> withdraw order: attack -> defend -> earn
      if (newNumberOfMachines < numberOfMachines) {
        numberOfMachinesToEarn = Math.min(numberOfMachinesToEarn, newNumberOfMachines);
        numberOfMachinesToDefend = Math.max(
          0,
          Math.min(numberOfMachinesToDefend, newNumberOfMachines - numberOfMachinesToEarn)
        );
        numberOfMachinesToAttack = Math.max(0, newNumberOfMachines - numberOfMachinesToDefend - numberOfMachinesToEarn);
      }

      await firestore
        .collection('gamePlay')
        .doc(gamePlay.id)
        .update({
          numberOfMachines: newNumberOfMachines,
          startRewardCountingTime: admin.firestore.Timestamp.fromMillis(now),
          pendingReward: admin.firestore.FieldValue.increment(generatedReward),
          active: !!active || gamePlay.data().active,
        });

      const snapshot = await admin
        .firestore()
        .collection('warDeployment')
        .where('userId', '==', user.docs[0].id)
        .where('seasonId', '==', activeSeasonId)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        await snapshot.docs[0].ref.update({
          numberOfMachinesToEarn,
          numberOfMachinesToAttack,
          numberOfMachinesToDefend,
        });
      }
    }
  }
};

const increaseGoon = async ({ address, amount }) => {
  console.log({ address, amount });
  const system = await firestore.collection('system').doc('default').get();
  const { activeSeasonId } = system.data();
  const user = await firestore.collection('user').where('address', '==', address.toLowerCase()).limit(1).get();
  if (!user.empty) {
    const gamePlay = await firestore
      .collection('gamePlay')
      .where('userId', '==', user.docs[0].id)
      .where('seasonId', '==', activeSeasonId)
      .limit(1)
      .get();
    if (!gamePlay.empty) {
      const now = Date.now();
      const generatedXToken = await calculateGeneratedXToken(user.docs[0].id);
      await firestore
        .collection('gamePlay')
        .doc(gamePlay.docs[0].id)
        .update({
          numberOfWorkers: admin.firestore.FieldValue.increment(amount),
          startXTokenCountingTime: admin.firestore.Timestamp.fromMillis(now),
        });

      await user.docs[0].ref.update({ xTokenBalance: admin.firestore.FieldValue.increment(generatedXToken) });
    }

    await firestore
      .collection('season')
      .doc(activeSeasonId)
      .update({
        workerSold: admin.firestore.FieldValue.increment(amount),
      });
  }
};

const increaseSafeHouse = async ({ address, amount }) => {
  console.log({ address, amount });
  const system = await firestore.collection('system').doc('default').get();
  const { activeSeasonId } = system.data();
  const user = await firestore.collection('user').where('address', '==', address.toLowerCase()).limit(1).get();
  if (!user.empty) {
    console.log('get Game play');
    const gamePlay = await firestore
      .collection('gamePlay')
      .where('userId', '==', user.docs[0].id)
      .where('seasonId', '==', activeSeasonId)
      .limit(1)
      .get();
    if (!gamePlay.empty) {
      const now = Date.now();
      const generatedReward = await calculateGeneratedReward(user.docs[0].id);
      console.log('Update Game play');
      await firestore
        .collection('gamePlay')
        .doc(gamePlay.docs[0].id)
        .update({
          numberOfBuildings: admin.firestore.FieldValue.increment(amount),
          startRewardCountingTime: admin.firestore.Timestamp.fromMillis(now),
          pendingReward: admin.firestore.FieldValue.increment(generatedReward),
        });
    }
    await firestore
      .collection('season')
      .doc(activeSeasonId)
      .update({
        buildingSold: admin.firestore.FieldValue.increment(amount),
      });
  }
};

const updatePrizePool = async (value) => {
  const system = await firestore.collection('system').doc('default').get();
  const { activeSeasonId } = system.data();

  await firestore
    .collection('season')
    .doc(activeSeasonId)
    .update({
      rankPrizePool: Number(value),
    });
};

const updateReputationPool = async (value) => {
  const system = await firestore.collection('system').doc('default').get();
  const { activeSeasonId } = system.data();

  await firestore
    .collection('season')
    .doc(activeSeasonId)
    .update({
      reputationPrizePool: Number(value),
    });
};

const increaseUserWhitelistAmountMinted = async ({ userId, amount }) => {
  const gamePlay = await getUserActiveGamePlay(userId);
  await gamePlay.update({ whitelistAmountMinted: admin.firestore.FieldValue.increment(amount) });
};

// utils
const calculateGeneratedReward = async (userId) => {
  const activeSeason = await getActiveSeason();

  const { machine } = activeSeason;

  const gamePlaySnapshot = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', activeSeason.id)
    .limit(1)
    .get();

  const gamePlay = gamePlaySnapshot.docs[0];
  const { startRewardCountingTime, numberOfMachines } = gamePlay.data();

  const now = Date.now();
  const start = startRewardCountingTime.toDate().getTime();
  const diffInDays = (now - start) / (24 * 60 * 60 * 1000);

  const generatedReward = diffInDays * (numberOfMachines * machine.dailyReward);
  return Math.round(generatedReward * 1000) / 1000;
};

const calculateGeneratedXToken = async (userId) => {
  const userSnapshot = await firestore.collection('user').doc(userId).get();
  if (!userSnapshot.exists) return 0;

  const gamePlay = await getUserActiveGamePlay(userId);
  if (!gamePlay) return;

  const { numberOfWorkers, startXTokenCountingTime } = gamePlay;

  const activeSeason = await getActiveSeason();
  const { worker } = activeSeason;

  const now = Date.now();
  const start = startXTokenCountingTime.toDate().getTime();
  const diffInDays = (now - start) / (24 * 60 * 60 * 1000);
  const generatedXToken = Math.round(diffInDays * (numberOfWorkers * worker.dailyReward) * 1000) / 1000;

  return generatedXToken;
};

const getUserFromAddress = async (address) => {
  const userSnapshot = await firestore.collection('user').where('address', '==', address.toLowerCase()).limit(1).get();
  const user = userSnapshot.docs[0];
  return user;
};

const getUserActiveGamePlay = async (userId) => {
  const activeSeasonId = await getActiveSeasonId();
  const gamePlaySnapshot = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', activeSeasonId)
    .limit(1)
    .get();

  const gamePlay = gamePlaySnapshot.docs[0];
  if (!gamePlay) return null;

  return { id: gamePlay.id, ...gamePlay.data() };
};

const calculateNewEstimatedEndTimeUnix = (currentEndTimeUnix, amount, timeIncrementInSeconds) => {
  return currentEndTimeUnix + amount * timeIncrementInSeconds * 1000;
};

export default gangsterArenaListener;
