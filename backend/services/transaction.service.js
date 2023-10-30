import admin, { firestore } from '../configs/firebase.config.js';
import { getActiveSeason } from './season.service.js';
import {
  calculateNextBuildingBuyPriceBatch,
  calculateNextWorkerBuyPriceBatch,
  calculateNewEstimatedEndTimeUnix,
  calculateReversePoolBonus,
} from '../utils/formulas.js';
import alchemy from '../configs/alchemy.config.js';
import { formatEther } from '@ethersproject/units';
import { claimToken as claimTokenTask, decodeTokenTxnLogs } from './worker.service.js';
import logger from '../utils/logger.js';
import environments from '../utils/environments.js';

const { TOKEN_ADDRESS, SYSTEM_ADDRESS, GAME_CONTRACT_ADDRESS } = environments;

export const initTransaction = async ({ userId, type, amount }) => {
  const activeSeason = await getActiveSeason();

  const { machine, machineSold, workerSold, buildingSold } = activeSeason;

  let token = '';
  let currentSold = 0;
  let value = 0;
  let prices = [];
  let isWarEnabled = null;
  switch (type) {
    case 'buy-machine':
      token = 'ETH';
      currentSold = machineSold;
      value = Math.round(machine.basePrice * amount * 1000) / 1000;
      prices = Array.from({ length: amount }, () => machine.basePrice);
      break;
    case 'buy-worker':
      token = 'FIAT';
      currentSold = workerSold;
      const workerPrices = calculateNextWorkerBuyPriceBatch(workerSold, amount);
      value = workerPrices.total;
      prices = workerPrices.prices;
      break;
    case 'buy-building':
      token = 'FIAT';
      currentSold = buildingSold;
      const buildingPrices = calculateNextBuildingBuyPriceBatch(workerSold, amount);
      value = buildingPrices.total;
      prices = buildingPrices.prices;
      break;
    case 'war-switch':
      const gamePlaySnapshot = await firestore
        .collection('gamePlay')
        .where('userId', '==', userId)
        .where('seasonId', '==', activeSeason.id)
        .get();
      const gamePlay = gamePlaySnapshot.docs[0];
      const { war } = gamePlay.data();
      isWarEnabled = war;
      break;
    default:
      break;
  }

  const data = {
    userId,
    seasonId: activeSeason.id,
    type,
    txnHash: '',
    token,
    amount,
    currentSold,
    value,
    // prices,
    isWarEnabled,
    status: 'Pending',
  };

  const newTransaction = await firestore.collection('transaction').add({
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ...data,
  });

  return { id: newTransaction.id, ...data };
};

const validateBlockchainTxn = async ({ userId, transactionId, txnHash }) => {
  try {
    // validate if this txnHash
    // - doesnt belongs to transaction in firestore - OK
    // - status === 1 - OK
    // - comes from user wallet address - OK
    // - buy-worker | buy-building ---> goes to token address - OK
    //                             ---> token sent to system wallet address - OK
    // - buy-machine ---> goes to game contract address - OK
    // - has the same token as the transaction doc in firestore - OK
    // - has the same value as the transaction doc in firestore - OK
    const txnSnapshot = await firestore.collection('transaction').where('txnHash', '==', txnHash).limit(1).get();
    if (!txnSnapshot.empty) throw new Error('Existed txnHash');

    const tx = await alchemy.core.getTransaction(txnHash);
    const receipt = await tx.wait();
    console.log(`transaction ${txnHash}`, tx, 'receipt', receipt);
    const { from, to, status, logs } = receipt;

    if (status !== 1) throw new Error('Invalid txn status');

    const userSnapshot = await firestore.collection('user').doc(userId).get();
    const { address } = userSnapshot.data();

    if (address?.toLowerCase() !== from.toLowerCase())
      throw new Error(`Bad request: invalid sender, txn: ${JSON.stringify(receipt)}`);

    const snapshot = await firestore.collection('transaction').doc(transactionId).get();
    const { type, value } = snapshot.data();

    if (['buy-worker', 'buy-building'].includes(type)) {
      if (to.toLowerCase() !== TOKEN_ADDRESS.toLowerCase())
        throw new Error(`Bad request: invalid receiver for ${type}, txn: ${JSON.stringify(receipt)}`);

      const decodedData = await decodeTokenTxnLogs('Transfer', logs[0]);
      if (decodedData.to.toLowerCase() !== SYSTEM_ADDRESS.toLowerCase())
        throw new Error(`Bad request: invalid token receiver for ${type}, txn: ${JSON.stringify(receipt)}`);

      const transactionValue = Number(logs[0].data.toString()) / 1e18;
      if (transactionValue !== value)
        throw new Error(`Bad request: Value doesnt match, ${JSON.stringify({ transactionValue, value })}`);
    }

    if (type === 'buy-machine') {
      if (to.toLowerCase() !== GAME_CONTRACT_ADDRESS.toLowerCase())
        throw new Error(`Bad request: invalid receiver for ${type}, txn: ${JSON.stringify(receipt)}`);

      const transactionValue = Number(tx.value.toString()) / 1e18;
      if (transactionValue !== value)
        throw new Error(`Bad request: Value doesnt match, ${JSON.stringify({ transactionValue, value })}`);
    }

    return true;
  } catch (err) {
    logger.error(
      `Error: Detect invalid txn, error: ${err.message}, ${JSON.stringify({ userId, transactionId, txnHash })}`
    );
  }
};

const updateSeasonState = async (transactionId) => {
  const snapshot = await firestore.collection('transaction').doc(transactionId).get();
  const { type, value, amount } = snapshot.data();

  const activeSeason = await getActiveSeason();
  const { estimatedEndTime } = activeSeason;
  const estimatedEndTimeUnix = estimatedEndTime.toDate().getTime();

  let newData;
  switch (type) {
    case 'buy-machine':
      newData = {
        estimatedEndTime: admin.firestore.Timestamp.fromMillis(
          calculateNewEstimatedEndTimeUnix(estimatedEndTimeUnix, amount)
        ),
        machineSold: admin.firestore.FieldValue.increment(1),
      };
      break;
    case 'buy-worker':
      newData = {
        workerSold: admin.firestore.FieldValue.increment(amount),
        reversePool: admin.firestore.FieldValue.increment(value),
      };
      break;
    case 'buy-building':
      newData = {
        buildingSold: admin.firestore.FieldValue.increment(amount),
        reversePool: admin.firestore.FieldValue.increment(value),
      };
      break;
    default:
      break;
  }

  await firestore
    .collection('season')
    .doc(activeSeason.id)
    .update({ ...newData });
};

const updateUserBalance = async (userId, transactionId) => {
  const userSnapshot = await firestore.collection('user').doc(userId).get();
  const snapshot = await firestore.collection('transaction').doc(transactionId).get();
  const { token } = snapshot.data();

  if (userSnapshot.exists) {
    const { address, ETHBalance } = userSnapshot.data();
    if (token === 'ETH') {
      const ethersProvider = await alchemy.config.getProvider();
      const value = await ethersProvider.getBalance(address);
      if (ETHBalance !== formatEther(value)) {
        await firestore
          .collection('user')
          .doc(userId)
          .update({
            ETHBalance: formatEther(value),
          });
      }
    }
  }
};

const updateUserGamePlay = async (userId, transactionId) => {
  const snapshot = await firestore.collection('transaction').doc(transactionId).get();
  const { type, amount } = snapshot.data();

  const activeSeason = await getActiveSeason();
  const { machine, worker, building } = activeSeason;

  // update user number of assets && pendingReward && startRewardCountingTime
  const gamePlaySnapshot = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', activeSeason.id)
    .get();
  const userGamePlay = gamePlaySnapshot.docs[0];
  const { numberOfWorkers, numberOfMachines, numberOfBuildings, pendingRewardSinceLastWar = 0 } = userGamePlay.data();
  const assets = {
    numberOfBuildings,
    numberOfMachines,
    numberOfWorkers,
  };

  let gamePlayData;
  switch (type) {
    case 'buy-machine':
      gamePlayData = { numberOfMachines: admin.firestore.FieldValue.increment(amount) };
      assets.numberOfMachines += amount;
      break;
    case 'buy-worker':
      gamePlayData = { numberOfWorkers: admin.firestore.FieldValue.increment(amount) };
      assets.numberOfWorkers += amount;
      break;
    case 'buy-building':
      gamePlayData = { numberOfBuildings: admin.firestore.FieldValue.increment(amount) };
      assets.numberOfBuildings += amount;
      break;
    default:
      break;
  }

  const calculatedPendingReward = await calculatePendingReward(userId);
  gamePlayData.pendingRewardSinceLastWar = pendingRewardSinceLastWar + calculatedPendingReward;
  gamePlayData.pendingReward = calculatedPendingReward;
  gamePlayData.startRewardCountingTime = admin.firestore.FieldValue.serverTimestamp();

  const networth =
    assets.numberOfBuildings * building.networth +
    assets.numberOfMachines * machine.networth +
    assets.numberOfWorkers * worker.networth;

  await userGamePlay.ref.update({ ...gamePlayData, networth });
};

const sendUserBonus = async (userId, transactionId) => {
  const userSnapshot = await firestore.collection('user').doc(userId).get();
  const { address } = userSnapshot.data();
  const snapshot = await firestore.collection('transaction').doc(transactionId).get();
  const { type } = snapshot.data();

  if (type === 'buy-machine') {
    const activeSeason = await getActiveSeason();
    const { reversePool } = activeSeason;
    const bonus = calculateReversePoolBonus(reversePool);

    const newTransaction = await firestore.collection('transaction').add({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userId,
      seasonId: activeSeason.id,
      type: 'bonus-token',
      txnHash: '',
      token: 'FIAT',
      value: bonus,
      status: 'Pending',
    });

    const { txnHash, status } = await claimTokenTask({
      address,
      amount: BigInt(bonus * 1e18),
    });

    await firestore.collection('transaction').doc(newTransaction.id).update({
      txnHash,
      status,
    });
  }
};

export const validateTxnHash = async ({ userId, transactionId, txnHash }) => {
  const valid = await validateBlockchainTxn({ userId, transactionId, txnHash });
  if (!valid) throw new Error('Bad request: Invalid txn');

  // update txnHash and status for transaction doc in firestore
  await firestore.collection('transaction').doc(transactionId).update({
    status: 'Success',
    txnHash,
  });

  // TODO: move this logic to trigger later
  // !!NOTE: everytime we update user balance, need to call to contract
  //       dont ever calculate balance manually
  await updateSeasonState(transactionId);
  await updateUserBalance(userId, transactionId);
  await updateUserGamePlay(userId, transactionId);
  await sendUserBonus(userId, transactionId);
};

export const claimToken = async ({ userId }) => {
  console.log('Claim token');
  const userSnapshot = await firestore.collection('user').doc(userId).get();
  const activeSeason = await getActiveSeason();

  if (userSnapshot.exists) {
    const { address, tokenBalance } = userSnapshot.data();
    const gamePlaySnapshot = await firestore
      .collection('gamePlay')
      .where('userId', '==', userId)
      .where('seasonId', '==', activeSeason.id)
      .limit(1)
      .get();
    if (!gamePlaySnapshot.empty) {
      const { lastClaimTime, pendingReward, startRewardCountingTime, numberOfMachines, numberOfWorkers } =
        gamePlaySnapshot.docs[0].data();

      const gamePlayId = gamePlaySnapshot.docs[0].id;
      const { machine, worker, claimGapInSeconds } = activeSeason;
      const now = Date.now();
      const diffInSeconds = (now - lastClaimTime.toDate().getTime()) / 1000;
      if (diffInSeconds < claimGapInSeconds) throw new Error('429: Too much claim request');

      const startRewardCountingDateUnix = startRewardCountingTime.toDate().getTime();
      const diffInDays = (now - startRewardCountingDateUnix) / (24 * 60 * 60 * 1000);
      const countingReward =
        diffInDays * (numberOfMachines * machine.dailyReward + numberOfWorkers * worker.dailyReward);

      await firestore
        .collection('gamePlay')
        .doc(gamePlayId)
        .update({
          lastClaimTime: admin.firestore.Timestamp.fromMillis(now),
          startRewardCountingTime: admin.firestore.Timestamp.fromMillis(now),
          pendingReward: 0,
        });
      await firestore
        .collection('user')
        .doc(userId)
        .update({
          tokenBalance: Number(tokenBalance) + Number(pendingReward) + Number(countingReward),
        });

      const newTransaction = await firestore.collection('transaction').add({
        createdAt: admin.firestore.Timestamp.fromMillis(now),
        userId,
        seasonId: activeSeason.id,
        type: 'claim-reward',
        token: 'FIAT',
        value: Math.floor(Number(pendingReward) + Number(countingReward)),
        status: 'Pending',
        txnHash: '',
      });

      const { txnHash, status } = await claimTokenTask({
        address,
        amount: BigInt(Math.floor(Number(pendingReward) + Number(countingReward)) * 1e12) * BigInt(1e6),
      });

      await firestore.collection('transaction').doc(newTransaction.id).update({
        txnHash,
        status,
      });
    }
  }
};

// utils
export const calculatePendingReward = async (userId) => {
  const activeSeason = await getActiveSeason();
  const gamePlaySnapshot = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', activeSeason.id)
    .get();

  const gamePlay = gamePlaySnapshot.docs[0];
  const { startRewardCountingTime, numberOfMachines, numberOfWorkers, pendingReward } = gamePlay.data();
  const { machine, worker } = activeSeason;

  const now = Date.now();
  const startRewardCountingTimeUnix = startRewardCountingTime.toDate().getTime();
  const diffInDays = (now - startRewardCountingTimeUnix) / (24 * 60 * 60 * 1000);

  const newPendingReward =
    pendingReward + diffInDays * (numberOfMachines * machine.dailyReward + numberOfWorkers * worker.dailyReward);
  return Math.round(newPendingReward * 1000) / 1000;
};
