import { Contract } from '@ethersproject/contracts';
import { formatEther } from '@ethersproject/units';
import GangsterArenaABI from '../assets/abis/GangsterArena.json' assert { type: 'json' };
import admin, { firestore } from '../configs/firebase.config.js';
import alchemy from '../configs/alchemy.config.js';
import environments from '../utils/environments.js';
import logger from '../utils/logger.js';
import { GangsterEvent } from '../utils/constants.js';
import { getActiveSeason } from '../services/season.service.js';

const { NETWORK_ID } = environments;

const gangsterArenaListener = async () => {
  const activeSeason = await getActiveSeason();
  const { gameAddress: GAME_CONTRACT_ADDRESS } = activeSeason || {};
  logger.info(`Start listen contract ${GAME_CONTRACT_ADDRESS} on Network ${NETWORK_ID}`);
  const ethersProvider = await alchemy.config.getWebSocketProvider();
  const contract = new Contract(GAME_CONTRACT_ADDRESS, GangsterArenaABI.abi, ethersProvider);

  contract.on(GangsterEvent.Mint, async (to, tokenId, amount, nonce, event) => {
    console.log({ to, tokenId, amount, nonce, event });
    await firestore.collection('web3Listener').doc(NETWORK_ID).update({ lastBlock: event.blockNumber });
    await processMintEvent({ to, tokenId, amount, nonce, event, contract });
  });

  contract.on(GangsterEvent.Deposit, async (from, to, amount, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).update({ lastBlock: event.blockNumber });
    await processDepositEvent({ from, to, amount, event, contract });
  });

  contract.on(GangsterEvent.Withdraw, async (from, to, amount, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).update({ lastBlock: event.blockNumber });
    await processWithdrawEvent({ from, to, amount, event, contract });
  });

  contract.on(GangsterEvent.Burn, async (from, to, amount, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).update({ lastBlock: event.blockNumber });
    for (let i = 0; i < from.length; i++) {
      await processBurnEvent({ from: from[i], to: to[i], amount: amount[i], event, contract });
    }
  });

  contract.on(GangsterEvent.BuyGoon, async (to, amount, nonce, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).update({ lastBlock: event.blockNumber });
    await processBuyGoonEvent({ to, amount, nonce, event, contract });
  });
  contract.on(GangsterEvent.BuySafeHouse, async (to, amount, nonce, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).update({ lastBlock: event.blockNumber });
    await processBuySafeHouseEvent({ to, amount, nonce, event, contract });
  });
};

// export const queryEvent = async (fromBlock) => {
//   const ethersProvider = await alchemy.config.getWebSocketProvider();
//   const contract = new Contract(TOKEN_ADDRESS, tokenABI.abi, ethersProvider);
//   const depositEvents = await contract.queryFilter('Transfer', fromBlock);
//   for (const event of depositEvents) {
//     const [from, to, value] = event.args;
//     // console.log({ wallet, amount });
//     await processTransferEvent({ from, to, value, event, contract });
//   }
// };

const processMintEvent = async ({ to, tokenId, amount, nonce, event, contract }) => {
  try {
    logger.info('NFT minted');
    logger.info({ to, tokenId, amount, nonce, event });
    const { transactionHash } = event;

    const gangsterNumber = await contract.gangster(to);
    const newBalance = gangsterNumber.toString();
    await updateNumberOfGangster({
      address: to.toLowerCase(),
      newBalance,
      active: true,
    });

    // TODO: update separate fields: rankPrizePool, reputationPrizePool, burnValue, devFee
    const prizePool = await contract.getBalance();
    await updatePrizePool(parseFloat(formatEther(prizePool)).toFixed(6));
  } catch (err) {
    logger.error(err);
  }
};

const processDepositEvent = async ({ from, to, amount, event, contract }) => {
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

    const gangsterNumber = await contract.gangster(from);
    const newBalance = gangsterNumber.toString();
    await updateNumberOfGangster({
      address: from.toLowerCase(),
      newBalance,
    });
  } catch (err) {
    logger.error(err);
  }
};

const processWithdrawEvent = async ({ from, to, amount, event, contract }) => {
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

    const gangsterNumber = await contract.gangster(from);
    const newBalance = gangsterNumber.toString();
    await updateNumberOfGangster({
      address: from.toLowerCase(),
      newBalance,
    });
  } catch (err) {
    logger.error(err);
  }
};

const processBurnEvent = async ({ from, to, amount, event, contract }) => {
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
    console.log(Number(nonce.toString()));
    await increaseGoon({ address: to, amount: Number(amount.toString()) });
    // handle in backend
    const txn = await firestore.collection('transaction').where('nonce', '==', Number(nonce.toString())).limit(1).get();
    if (!txn.empty) {
      const txnId = txn.docs[0].id;
      const txnData = txn.docs[0].data();
      await firestore.collection('transaction').doc(txnId).update({
        status: 'Success',
      });
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

const updateNumberOfGangster = async ({ address, newBalance, active = false }) => {
  logger.info({ address, newBalance: Number(newBalance) });
  const system = await firestore.collection('system').doc('default').get();
  const { activeSeasonId } = system.data();
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
      const { numberOfMachines, warDeployment } = gamePlay.data();
      const now = Date.now();
      const generatedReward = await calculateGeneratedReward(user.docs[0].id);

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
          warDeploment: {
            ...warDeployment,
            numberOfMachinesToEarn,
            numberOfMachinesToAttack,
            numberOfMachinesToDefend,
          },
          startRewardCountingTime: admin.firestore.Timestamp.fromMillis(now),
          pendingReward: admin.firestore.FieldValue.increment(generatedReward),
          active: !!active || gamePlay.data().active,
        });
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
      const generatedReward = await calculateGeneratedReward(user.docs[0].id);
      await firestore
        .collection('gamePlay')
        .doc(gamePlay.docs[0].id)
        .update({
          numberOfWorkers: admin.firestore.FieldValue.increment(amount),
          startRewardCountingTime: admin.firestore.Timestamp.fromMillis(now),
          pendingReward: admin.firestore.FieldValue.increment(generatedReward),
        });
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
      prizePool: Number(value),
    });
};

const calculateGeneratedReward = async (userId) => {
  const system = await firestore.collection('system').doc('default').get();
  const { activeSeasonId } = system.data();
  const activeSeasonSnapshot = await firestore.collection('season').doc(activeSeasonId).get();
  const activeSeason = { id: activeSeasonId, ...activeSeasonSnapshot.data() };
  if (activeSeason.status !== 'open') throw new Error('Season ended');

  const { machine, worker } = activeSeason;

  const gamePlaySnapshot = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', activeSeason.id)
    .limit(1)
    .get();

  const gamePlay = gamePlaySnapshot.docs[0];
  const { startRewardCountingTime, numberOfMachines, numberOfWorkers } = gamePlay.data();

  const now = Date.now();
  const start = startRewardCountingTime.toDate().getTime();
  const diffInDays = (now - start) / (24 * 60 * 60 * 1000);

  const generatedReward = diffInDays * (numberOfMachines * machine.dailyReward + numberOfWorkers * worker.dailyReward);
  return Math.round(generatedReward * 1000) / 1000;
};

export default gangsterArenaListener;
