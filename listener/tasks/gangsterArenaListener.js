import { Contract } from '@ethersproject/contracts';
import { formatEther } from '@ethersproject/units';
import GangsterArenaABI from '../assets/abis/GangsterArena.json' assert { type: 'json' };
import admin, { firestore } from '../configs/firebase.config.js';
import alchemy from '../configs/alchemy.config.js';
import environments from '../utils/environments.js';
import logger from '../utils/logger.js';
import { GangsterEvent } from '../utils/constants.js';

const { GAME_CONTRACT_ADDRESS, NETWORK_ID } = environments;

const gangsterArenaListener = async () => {
  const ethersProvider = await alchemy.config.getWebSocketProvider();
  const contract = new Contract(GAME_CONTRACT_ADDRESS, GangsterArenaABI.abi, ethersProvider);

  contract.on(GangsterEvent.Mint, async (from, to, amount, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).update({ lastBlock: event.blockNumber });
    await processMintEvent({ from, to, amount, event, contract });
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
    for (let i = 0; i < from.length(); i++) {
      await processBurnEvent({ from: from[i], to: to[i], amount: amount[i], event, contract });
    }
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

const processMintEvent = async ({ from, to, amount, event, contract }) => {
  try {
    logger.info('NFT minted');
    logger.info({ from, to, amount, event });
    const { transactionHash } = event;

    const gangsterNumber = await contract.gangster(from);
    const newBalance = gangsterNumber.toString();
    await updateNumberOfGangster({
      address: from.toLowerCase(),
      newBalance,
    });

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

const updateNumberOfGangster = async ({ address, newBalance }) => {
  logger.info({ address, newBalance: Number(newBalance) });
  const system = await firestore.collection('system').doc('default').get();
  const { activeSeasonId } = system.data();
  const user = await firestore.collection('user').where('address', '==', address).limit(1).get();
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
          numberOfMachines: Number(newBalance),
          startRewardCountingTime: admin.firestore.Timestamp.fromMillis(now),
          pendingReward: admin.firestore.FieldValue.increment(generatedReward),
        });
    }
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