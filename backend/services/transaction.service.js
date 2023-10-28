import admin, { firestore } from '../configs/firebase.config.js';
import { getActiveSeason } from './season.service.js';
import {
  calculateNextBuildingBuyPriceBatch,
  calculateNextWorkerBuyPriceBatch,
  calculateNewEstimatedEndTimeUnix,
  calculateReversePoolBonus,
} from '../utils/formulas.js';

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
    prices,
    isWarEnabled,
    status: 'pending',
  };

  const newTransaction = await firestore.collection('transaction').add({
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ...data,
  });

  return { id: newTransaction.id, ...data };
};

const validateBlockchainTxn = async ({ userId, transactionId, txnHash }) => {
  // validate if this txnHash
  // - doesnt belongs to transaction in firestore
  // - comes from user wallet address
  // - buy-worker | buy-building ---> goes to system wallet address
  // - buy-machine ---> goes to nft contract address
  // - has the same token as the transaction doc in firestore
  // - has the same value as the transaction doc in firestore
  const snapshot = await firestore.collection('transaction').doc(transactionId).get();
  const { type, value, amount } = snapshot.data();

  // always return true for the moment
  return true;
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
  const snapshot = await firestore.collection('transaction').doc(transactionId).get();
  const { value, token } = snapshot.data();

  // update user balance for both ETH and FIAT
  // TODO: move this logic to trigger later
  // need to call the contract to get user balances
  // for temporary: update directly in the db
  const userData =
    token === 'ETH'
      ? { ETHBalance: admin.firestore.FieldValue.increment(-value) }
      : { tokenBalance: admin.firestore.FieldValue.increment(-value) };
  await firestore
    .collection('user')
    .doc(userId)
    .update({
      ...userData,
    });
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
  const snapshot = await firestore.collection('transaction').doc(transactionId).get();
  const { type } = snapshot.data();

  if (type === 'buy-machine') {
    // TODO: send user FIAT bonus using system wallet
    const activeSeason = await getActiveSeason();
    const { reversePool } = activeSeason;
    const bonus = calculateReversePoolBonus(reversePool);
    // this document need to be created with pending status before sending bonus
    // then update its status after the txn is succeed
    await firestore.collection('transaction').add({
      userId,
      seasonId: activeSeason.id,
      type: 'bonus-token',
      txnHash: '',
      token: 'FIAT',
      value: bonus,
      status: 'success',
    });

    // update user tokenBalance
    // TODO: move this logic to trigger later
    // call smartcontract to update balance
    await firestore
      .collection('user')
      .doc(userId)
      .update({ tokenBalance: admin.firestore.FieldValue.increment(bonus) });
  }
};

export const validateTxnHash = async ({ userId, transactionId, txnHash }) => {
  const valid = await validateBlockchainTxn({ userId, transactionId, txnHash });
  if (!valid) throw new Error('Bad request: Invalid txn');

  // update txnHash and status for transaction doc in firestore
  await firestore.collection('transaction').doc(transactionId).update({
    status: 'success',
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

// utils
export const calculatePendingReward = async (userId) => {
  const activeSeason = await getActiveSeason();
  const gamePlaySnapshot = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', activeSeason.id)
    .get();

  const gamePlay = gamePlaySnapshot.docs[0];
  const { startRewardCountingTime, numberOfMachines, numberOfWorkers } = gamePlay.data();
  const { machine, worker } = activeSeason;

  const now = Date.now();
  const startRewardCountingTimeUnix = startRewardCountingTime.toDate().getTime();
  const diffInDays = (now - startRewardCountingTimeUnix) / (24 * 60 * 60 * 1000);

  const pendingReward = diffInDays * (numberOfMachines * machine.dailyReward + numberOfWorkers * worker.dailyReward);
  return Math.round(pendingReward * 1000) / 1000;
};
