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

  contract.on(GangsterEvent.Deposit, async (to, tokenId, amount, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).set({ lastBlock: event.blockNumber });
    await processDepositEvent({ to, amount, event, contract, nftContract });
  });

  contract.on(GangsterEvent.Withdraw, async (to, tokenId, amount, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).set({ lastBlock: event.blockNumber });
    await processWithdrawEvent({ to, amount, event, contract, nftContract });
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
    if (!user) throw new Error('Not found user');

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

    if (txnSnapshot.empty) throw new Error('Not found txn');

    const txn = txnSnapshot.docs[0];
    const { isMintWhitelist, referrerAddress, referralDiscount } = txn.data();

    // update txn
    console.log('update txn');
    batch.update(txn.ref, { status: 'Success', txnHash: transactionHash });

    // update season
    console.log('update season');
    const estimatedEndTimeUnix = estimatedEndTime.toDate().getTime();
    const newEndTimeUnix = calculateNewEstimatedEndTimeUnix(
      estimatedEndTimeUnix,
      Number(amount.toString()),
      timeIncrementInSeconds
    );

    const prizePool = await contract.rankPrize();
    const retirePool = await contract.reputationPrize();

    const seasonRef = firestore.collection('season').doc(activeSeason.id);
    batch.update(seasonRef, {
      estimatedEndTime: admin.firestore.Timestamp.fromMillis(newEndTimeUnix),
      machineSold: admin.firestore.FieldValue.increment(Number(amount.toString())),
      rankPrizePool: Number(parseFloat(formatEther(prizePool)).toFixed(6)),
      reputationPrizePool: Number(parseFloat(formatEther(retirePool)).toFixed(6)),
    });

    // update user && referrer
    console.log('update user && referrer');

    // update gamePlay && warDeployment
    console.log('update gamPlay && warDeployment');
    const { gamePlayId, gamePlay, warDeploymentId, warDeployment } = await getUserNewMachines({
      userId: user.id,
      address: user.data().address,
      nftContract,
    });

    if (isMintWhitelist) {
      gamePlay.whitelistAmountMinted = admin.firestore.FieldValue.increment(Number(amount.toString()));
    }

    if (gamePlayId) {
      const gamePlayRef = firestore.collection('gamePlay').doc(gamePlayId);
      batch.update(gamePlayRef, { ...gamePlay, active: true });
    }

    if (warDeploymentId) {
      const warDeploymentRef = firestore.collection('warDeployment').doc(warDeploymentId);
      batch.update(warDeploymentRef, warDeployment);
    }

    console.log('start batching...');
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
    logger.error(`Error in processMintEvent, ${err.message}, ${JSON.stringify(err)}`);
  }
};

const processRetireEvent = async ({ to, amount, nonce, event, contract }) => {
  try {
    logger.info('retire event');
    logger.info({ to, amount, nonce, event });

    const { transactionHash } = event;

    // need to update txn, gamePlay, warDeployment, season
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

    // update txn
    batch.update(txn.ref, { status: 'Success', txnHash: transactionHash });

    // update gamePlay
    const gamePlay = await getUserActiveGamePlay();
    const gamePlayRef = firestore.collection('gamePlay').doc(gamePlay.id);
    batch.update(gamePlayRef, {
      numberOfMachines: 0,
      numberOfBuildings: 0,
      numberOfWorkers: 0,
      active: false,
      pendingReward: 0,
      startRewardCountingTime: admin.firestore.FieldValue.serverTimestamp(),
      startXTokenCountingTime: admin.firestore.FieldValue.serverTimestamp(),
      pendingXToken: 0,
      startXTokenRewardCountingTime: admin.firestore.FieldValue.serverTimestamp(),
    });

    // update warDeployment
    const warDeploymentSnapshot = await firestore
      .collection('warDeployment')
      .where('userId', '==', user.docs[0].id)
      .where('seasonId', '==', gamePlay.seasonId)
      .limit(1)
      .get();
    if (!warDeploymentSnapshot.empty) {
      const warDeploymentRef = warDeploymentSnapshot.docs[0].ref;
      batch.update(warDeploymentRef, {
        numberOfMachinesToEarn: 0,
        numberOfMachinesToAttack: 0,
        numberOfMachinesToDefend: 0,
        attackUserId: null,
      });
    }

    // update season
    const prizePool = await contract.rankPrize();
    const retirePool = await contract.reputationPrize();
    const seasonRef = firestore.collection('season').doc(gamePlay.seasonId);
    batch.update(seasonRef, {
      rankPrizePool: Number(parseFloat(formatEther(prizePool)).toFixed(6)),
      reputationPrizePool: Number(parseFloat(formatEther(retirePool)).toFixed(6)),
    });

    let retry = 0;
    let isSuccess = false;
    while (retry < MAX_RETRY && !isSuccess) {
      try {
        logger.info(
          `Start processRetireEvent. Retry ${retry++} times. ${JSON.stringify({ to, amount, nonce, event })}`
        );
        await batch.commit();
        isSuccess = true;
      } catch (err) {
        logger.error(`Unsuccessful processRetireEvent txn: ${JSON.stringify(err)}`);
      }
    }
  } catch (err) {
    logger.error(`Error in processRetireEvent, ${err.message}, ${JSON.stringify(err)}`);
  }
};

const processDepositEvent = async ({ to, amount, event, contract, nftContract }) => {
  try {
    logger.info('process deposit event');
    logger.info({ to, amount, event });
    const { transactionHash } = event;

    // need to create txn, gamePlay, warDeployment
    const batch = firestore.batch();

    const user = await getUserFromAddress(to);
    if (!user) return;

    const activeSeasonId = await getActiveSeasonId();

    // create txn
    const txnRef = firestore.collection('transaction').doc();
    batch.create(txnRef, {
      userId: user.id,
      seasonId: activeSeasonId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      type: 'deposit-machine',
      txnHash: transactionHash,
      token: 'Machine',
      amount: Number(amount.toString()),
      status: 'Success',
      value: 0,
    });

    // update gamePlay && warDeployment
    const { gamePlayId, gamePlay, warDeploymentId, warDeployment } = await getUserNewMachines({
      userId: user.id,
      address: user.data().address,
      nftContract,
    });

    if (gamePlayId) {
      const gamePlayRef = firestore.collection('gamePlay').doc(gamePlayId);
      batch.update(gamePlayRef, { ...gamePlay });
    }

    if (warDeploymentId) {
      const warDeploymentRef = firestore.collection('warDeployment').doc(warDeploymentId);
      batch.update(warDeploymentRef, warDeployment);
    }

    let retry = 0;
    let isSuccess = false;
    while (retry < MAX_RETRY && !isSuccess) {
      try {
        logger.info(`Start processDepositEvent. Retry ${retry++} times. ${JSON.stringify({ to, amount, event })}`);
        await batch.commit();
        isSuccess = true;
      } catch (err) {
        logger.error(`Unsuccessful processDepositEvent txn: ${JSON.stringify(err)}`);
      }
    }
  } catch (err) {
    logger.error(`Error in processDepositEvent, ${err.message}, ${JSON.stringify(err)}`);
  }
};

const processWithdrawEvent = async ({ to, amount, event, contract, nftContract }) => {
  try {
    logger.info('process withdraw event');
    logger.info({ to, amount, event });
    const { transactionHash } = event;

    // need to create txn, gamePlay, warDeployment
    const batch = firestore.batch();

    const user = await getUserFromAddress(to);
    if (!user) return;

    const activeSeasonId = await getActiveSeasonId();

    // create txn
    const txnRef = firestore.collection('transaction').doc();
    batch.create(txnRef, {
      userId: user.id,
      seasonId: activeSeasonId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      type: 'withdraw-machine',
      txnHash: transactionHash,
      token: 'Machine',
      amount: Number(amount.toString()),
      status: 'Success',
      value: 0,
    });

    // update gamePlay && warDeployment
    const { gamePlayId, gamePlay, warDeploymentId, warDeployment } = await getUserNewMachines({
      userId: user.id,
      address: user.data().address,
      nftContract,
    });

    if (gamePlayId) {
      const gamePlayRef = firestore.collection('gamePlay').doc(gamePlayId);
      batch.update(gamePlayRef, { ...gamePlay });
    }

    if (warDeploymentId) {
      const warDeploymentRef = firestore.collection('warDeployment').doc(warDeploymentId);
      batch.update(warDeploymentRef, warDeployment);
    }

    let retry = 0;
    let isSuccess = false;
    while (retry < MAX_RETRY && !isSuccess) {
      try {
        logger.info(`Start processWithdrawEvent. Retry ${retry++} times. ${JSON.stringify({ to, amount, event })}`);
        await batch.commit();
        isSuccess = true;
      } catch (err) {
        logger.error(`Unsuccessful processWithdrawEvent txn: ${err.message}, ${JSON.stringify(err)}`);
      }
    }
  } catch (err) {
    logger.error(`Error in processWithdrawEvent, ${err.message}, ${JSON.stringify(err)}`);
  }
};

const processBuyGoonEvent = async ({ to, amount, nonce, event, contract }) => {
  try {
    logger.info('processBuyGoonEvent');
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

    // update txn
    batch.update(txn.ref, { status: 'Success', txnHash: transactionHash });

    // update season
    const seasonRef = firestore.collection('season').doc(activeSeasonId);
    batch.update(seasonRef, { workerSold: admin.firestore.FieldValue.increment(Number(amount.toString())) });

    // update gamePlay
    const gamePlay = await getUserActiveGamePlay(user.id);
    const generatedXToken = await calculateGeneratedXToken(user.id);
    const gamePlayRef = firestore.collection('gamePlay').doc(gamePlay.id);
    batch.update(gamePlayRef, {
      numberOfWorkers: admin.firestore.FieldValue.increment(Number(amount.toString())),
      startXTokenCountingTime: admin.firestore.FieldValue.serverTimestamp(),
    });

    // update user xTokenBalance
    batch.update(user.ref, { xTokenBalance: admin.firestore.FieldValue.increment(generatedXToken) });

    // update worker-txn-price
    const { createdAt, prices, value } = txn.data();
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
        logger.info(
          `Start processBuyGoonEvent. Retry ${retry++} times. ${JSON.stringify({ to, amount, nonce, event })}`
        );
        await batch.commit();
        isSuccess = true;
      } catch (err) {
        logger.error(`Unsuccessful processBuyGoonEvent txn: ${JSON.stringify(err)}`);
      }
    }
  } catch (err) {
    logger.error(`Error in processBuyGoonEvent, ${err.message}, ${JSON.stringify(err)}`);
  }
};

const processBuySafeHouseEvent = async ({ to, amount, nonce, event, contract }) => {
  try {
    logger.info('process event');
    logger.info({ to, amount, nonce, event });
    const { transactionHash } = event;

    // need to update txn, season, gamePlay, building-txn-prices
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

    const activeSeason = await getActiveSeason();
    const {
      id: activeSeasonId,
      estimatedEndTime,
      endTimeConfig: { timeDecrementInSeconds },
    } = activeSeason;

    // update txn
    batch.update(txn.ref, { status: 'Success', txnHash: transactionHash });

    // update season
    const estimatedEndTimeUnix = estimatedEndTime.toDate().getTime();
    const newEndTimeUnix = calculateNewEstimatedEndTimeUnix(
      estimatedEndTimeUnix,
      Number(amount.toString()),
      -timeDecrementInSeconds
    );
    const seasonRef = firestore.collection('season').doc(activeSeasonId);
    batch.update(seasonRef, {
      workerSold: admin.firestore.FieldValue.increment(Number(amount.toString())),
      estimatedEndTime: admin.firestore.Timestamp.fromMillis(newEndTimeUnix),
    });

    // update gamePlay
    const gamePlay = await getUserActiveGamePlay(user.id);
    const gamePlayRef = firestore.collection('gamePlay').doc(gamePlay.id);
    batch.update(gamePlayRef, {
      numberOfBuildings: admin.firestore.FieldValue.increment(Number(amount.toString())),
    });

    // update building-txn-price
    const { createdAt, prices, value } = txn.data();
    const buildingTxnPriceRef = firestore.collection('building-txn-prices').doc(txn.id);
    batch.set(buildingTxnPriceRef, {
      txnId: txn.id,
      createdAt,
      avgPrice: prices.length > 0 ? value / prices.length : 0,
      seasonId: activeSeasonId,
    });

    let retry = 0;
    let isSuccess = false;
    while (retry < MAX_RETRY && !isSuccess) {
      try {
        logger.info(
          `Start processBuySafeHouseEvent. Retry ${retry++} times. ${JSON.stringify({ to, amount, nonce, event })}`
        );
        await batch.commit();
        isSuccess = true;
      } catch (err) {
        logger.error(`Unsuccessful processBuySafeHouseEvent txn: ${JSON.stringify(err)}`);
      }
    }
  } catch (err) {
    logger.error(`Error in processBuySafeHouseEvent, ${err.message}, ${JSON.stringify(err)}`);
  }
};

const getUserNewMachines = async ({ userId, address, nftContract }) => {
  try {
    const gangsterNumber = await nftContract.gangster(address);
    const newBalance = Number(gangsterNumber.toString());

    const gamePlay = await getUserActiveGamePlay(userId);
    if (!gamePlay) return { gamePlay: {}, warDeployment: {} };

    const { numberOfMachines } = gamePlay;
    const now = Date.now();
    const generatedReward = await calculateGeneratedReward(userId);

    const warDeploymentSnapshot = await admin
      .firestore()
      .collection('warDeployment')
      .where('userId', '==', userId)
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

    const warDeployment = { id: warDeploymentSnapshot.docs[0].id, ...warDeploymentSnapshot.docs[0].data() };

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
  } catch (err) {
    console.error(err);
    logger.error(`Error in getting user new machines, ${JSON.stringify(err)}`);
    throw err;
  }
};

// utils
const calculateGeneratedReward = async (userId) => {
  const activeSeasonId = await getActiveSeasonId();

  const gamePlaySnapshot = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', activeSeasonId)
    .limit(1)
    .get();

  const gamePlay = gamePlaySnapshot.docs[0];
  const { startRewardCountingTime, numberOfMachines, machine, building } = gamePlay.data();

  const numberOfActiveMachines = Math.min(numberOfMachines, building?.machineCapacity || 0);
  const now = Date.now();
  const start = startRewardCountingTime.toDate().getTime();
  const diffInDays = (now - start) / (24 * 60 * 60 * 1000);

  const generatedReward = diffInDays * (numberOfActiveMachines * machine.dailyReward);
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
