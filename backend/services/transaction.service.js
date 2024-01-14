import { BigNumber } from 'alchemy-sdk';
import { formatEther, parseEther } from '@ethersproject/units';

import admin, { firestore } from '../configs/firebase.config.js';
import alchemy from '../configs/alchemy.config.js';
import { getActiveSeason, updateSeasonSnapshotSchedule } from './season.service.js';
import {
  claimToken as claimTokenTask,
  claimTokenBonus,
  decodeTokenTxnLogs,
  isMinted,
  signMessageBuyGoon,
  signMessageBuyGangster,
} from './worker.service.js';
import {
  calculateNextBuildingBuyPriceBatch,
  calculateNextWorkerBuyPriceBatch,
  calculateNewEstimatedEndTimeUnix,
  calculateReservePoolBonus,
} from '../utils/formulas.js';
import { getAccurate } from '../utils/math.js';
import logger from '../utils/logger.js';
import environments from '../utils/environments.js';

const { SYSTEM_ADDRESS } = environments;

export const initTransaction = async ({ userId, type, ...data }) => {
  logger.info(`init transaction user:${userId} - type:${type}`);
  const activeSeason = await getActiveSeason();

  if (type !== 'withdraw' && data.token !== 'NFT' && activeSeason.status !== 'open') throw new Error('Season ended');

  const { machine, machineSold, workerSold, buildingSold, worker, building, referralConfig, startTime } = activeSeason;
  const txnData = {};
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  switch (type) {
    case 'withdraw':
      txnData.value = data.value;
      txnData.to = data.to;
      txnData.token = data.token;
      break;
    case 'buy-machine':
      txnData.token = 'ETH';
      txnData.currentSold = machineSold;

      const gamePlaySnapshot = await firestore
        .collection('gamePlay')
        .where('userId', '==', userId)
        .where('seasonId', '==', activeSeason.id)
        .limit(1)
        .get();
      const userSnapshot = await firestore.collection('user').doc(userId).get();
      const { isWhitelisted, whitelistAmountLeft } = gamePlaySnapshot.docs[0].data();
      const { inviteCode } = userSnapshot.data();
      let userReferralDiscount = 0;
      const isMintWhitelist = Boolean(isWhitelisted && whitelistAmountLeft);
      txnData.isMintWhitelist = isMintWhitelist;
      txnData.amount = isMintWhitelist ? Math.min(data.amount, whitelistAmountLeft) : data.amount; // cannot exceed whitelistAmountLeft

      if (inviteCode && !isMintWhitelist) {
        const referrerSnapshot = await firestore
          .collection('user')
          .where('referralCode', '==', inviteCode)
          .limit(1)
          .get();
        if (!referrerSnapshot.size) break;

        userReferralDiscount = referralConfig.referralDiscount;
        txnData.referrerAddress = referrerSnapshot.docs[0].data().address;
        txnData.referralDiscount = getAccurate(data.amount * machine.basePrice * userReferralDiscount);
      }
      const unitPrice = isMintWhitelist
        ? machine.whitelistPrice
        : getAccurate(machine.basePrice * (1 - userReferralDiscount));
      const estimatedPrice = data.amount * unitPrice;
      txnData.value = getAccurate(estimatedPrice);
      txnData.prices = Array.from({ length: data.amount }, () => unitPrice);
      // bonus
      const daysElapsed = (now - startTime.toDate().getTime()) / (24 * 60 * 60 * 1000);
      const bonus = Math.floor(daysElapsed * machine.dailyReward * data.amount);
      txnData.bonusAmount = bonus;
      break;
    case 'buy-worker':
      txnData.amount = data.amount;
      txnData.token = 'FIAT';
      txnData.currentSold = workerSold;
      const workerTxns = await firestore
        .collection('transaction')
        .where('type', '==', 'buy-worker')
        .where('status', '==', 'Success')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(oneWeekAgo))
        .get();
      const workerSalesLastPeriod = workerTxns.docs.reduce((total, doc) => total + doc.data().amount, 0);
      const workerPrices = calculateNextWorkerBuyPriceBatch(
        workerSalesLastPeriod,
        worker.targetDailyPurchase,
        worker.targetPrice,
        worker.basePrice,
        data.amount
      );
      txnData.value = workerPrices.total;
      txnData.prices = workerPrices.prices;
      break;
    case 'buy-building':
      txnData.amount = data.amount;
      txnData.token = 'FIAT';
      txnData.currentSold = buildingSold;
      const buildingTxns = await firestore
        .collection('transaction')
        .where('type', '==', 'buy-building')
        .where('status', '==', 'Success')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(oneWeekAgo))
        .get();
      const buildingSalesLastPeriod = buildingTxns.docs.reduce((total, doc) => total + doc.data().amount, 0);
      const buildingPrices = calculateNextBuildingBuyPriceBatch(
        buildingSalesLastPeriod,
        building.targetDailyPurchase,
        building.targetPrice,
        building.basePrice,
        data.amount
      );
      txnData.value = buildingPrices.total;
      txnData.prices = buildingPrices.prices;
      break;
    case 'war-bonus':
      txnData.value = data.value;
      txnData.token = 'FIAT';
      break;
    case 'war-penalty':
      const { machinesDeadCount } = data;
      txnData.machinesDeadCount = machinesDeadCount;
      break;
    default:
      break;
  }

  // TODO: fix duplicate nonce
  await firestore
    .collection('system')
    .doc('data')
    .update({
      nonce: admin.firestore.FieldValue.increment(1),
    });
  const systemData = await firestore.collection('system').doc('data').get();
  const { nonce } = systemData.data();
  const transaction = {
    userId,
    seasonId: activeSeason.id,
    type,
    txnHash: '',
    status: 'Pending',
    nonce,
    ...txnData,
  };
  const newTransaction = await firestore.collection('transaction').add({
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ...transaction,
  });

  if (type === 'buy-worker' || type === 'buy-building') {
    console.log('init txn', txnData);
    const userData = await firestore.collection('user').doc(userId).get();
    if (userData.exists) {
      const { address } = userData.data();
      const signature = await signMessageBuyGoon({
        address: address,
        amount: txnData.amount,
        value: parseEther(txnData.value + ''),
        nonce: nonce,
      });
      return { id: newTransaction.id, ...transaction, signature };
    }
  }

  if (type === 'buy-machine') {
    const userData = await firestore.collection('user').doc(userId).get();
    if (userData.exists) {
      const { address } = userData.data();
      const signedData = {
        address,
        amount: txnData.amount,
        bonus: txnData.bonusAmount,
        nonce,
      };
      if (txnData.referrerAddress) signedData.referral = txnData.referrerAddress;
      const signature = await signMessageBuyGangster(signedData);
      return { id: newTransaction.id, ...transaction, signature };
    }
  }

  return { id: newTransaction.id, ...transaction };
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
    // console.log(`transaction ${txnHash}`, tx, 'receipt', receipt);
    const { from, to, status, logs } = receipt;

    if (status !== 1) throw new Error('Invalid txn status');

    const userSnapshot = await firestore.collection('user').doc(userId).get();
    const { address } = userSnapshot.data();

    if (address?.toLowerCase() !== from.toLowerCase() && SYSTEM_ADDRESS?.toLowerCase() !== from.toLowerCase())
      throw new Error(`Bad request: invalid sender, txn: ${JSON.stringify(receipt)}`);

    const snapshot = await firestore.collection('transaction').doc(transactionId).get();
    const { type, value, token } = snapshot.data();

    const transactionValue = token === 'ETH' ? tx.value : BigNumber.from(logs[0].data);
    const bnValue = BigNumber.from(BigInt(Math.round(value * 1e12))).mul(BigNumber.from(1e6));
    console.log({ logdata: logs[0]?.data, value, bnValue, v1: BigNumber.from(BigInt(Math.round(value * 1e12))) });

    const activeSeason = await getActiveSeason();
    const { tokenAddress: TOKEN_ADDRESS } = activeSeason || {};

    if (type === 'withdraw') {
      if (token === 'FIAT' && to.toLowerCase() !== TOKEN_ADDRESS.toLowerCase())
        throw new Error(`Bad request: invalid receiver for ${type}, txn: ${JSON.stringify(receipt)}`);

      // if (!bnValue.eq(transactionValue))
      //   throw new Error(`Bad request: Value doesnt match, ${JSON.stringify({ transactionValue, bnValue })}`);
    }

    if (['buy-worker', 'buy-building'].includes(type)) {
      if (to.toLowerCase() !== TOKEN_ADDRESS.toLowerCase())
        throw new Error(`Bad request: invalid receiver for ${type}, txn: ${JSON.stringify(receipt)}`);

      const decodedData = await decodeTokenTxnLogs('Transfer', logs[0]);
      if (decodedData.to.toLowerCase() !== SYSTEM_ADDRESS.toLowerCase())
        throw new Error(`Bad request: invalid token receiver for ${type}, txn: ${JSON.stringify(receipt)}`);
      console.log({ value, bnValue, transactionValue });
      console.log(bnValue.eq(transactionValue));
      if (!bnValue.eq(transactionValue))
        throw new Error(`Bad request: Value doesnt match, ${JSON.stringify({ transactionValue, bnValue })}`);
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

  console.log('\n\nupdateSeasonState', { type, value, amount });
  const activeSeason = await getActiveSeason();
  const { estimatedEndTime, timeStepInHours } = activeSeason;
  const estimatedEndTimeUnix = estimatedEndTime.toDate().getTime();

  let newData;
  switch (type) {
    case 'buy-machine':
      newData = {
        estimatedEndTime: admin.firestore.Timestamp.fromMillis(
          calculateNewEstimatedEndTimeUnix(estimatedEndTimeUnix, amount, timeStepInHours)
        ),
        machineSold: admin.firestore.FieldValue.increment(1),
      };
      break;
    case 'buy-worker':
      newData = {
        workerSold: admin.firestore.FieldValue.increment(amount),
        reservePool: admin.firestore.FieldValue.increment(value),
      };
      break;
    case 'buy-building':
      newData = {
        buildingSold: admin.firestore.FieldValue.increment(amount),
        reservePool: admin.firestore.FieldValue.increment(value),
      };
      break;
    default:
      break;
  }

  // type 'war-switch' | 'war-penalty'
  if (!newData) return;

  await firestore
    .collection('season')
    .doc(activeSeason.id)
    .update({ ...newData });

  // end time changed
  if (newData.estimatedEndTime) await updateSeasonSnapshotSchedule().catch((e) => logger.error(e));
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
  const { type, amount, value, isMintWhitelist, referrerAddress, referralDiscount } = snapshot.data();

  const activeSeason = await getActiveSeason();
  const { referralConfig } = activeSeason;

  // update user number of assets && pendingReward && startRewardCountingTime
  const gamePlaySnapshot = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', activeSeason.id)
    .limit(1)
    .get();
  const userGamePlay = gamePlaySnapshot.docs[0];
  logger.debug(`userGamePlay before update: ${JSON.stringify(userGamePlay.data())}`);
  const { numberOfWorkers, numberOfMachines, numberOfBuildings, warDeployment } = userGamePlay.data();
  const assets = {
    numberOfBuildings,
    numberOfMachines,
    numberOfWorkers,
  };

  let gamePlayData = {};
  switch (type) {
    case 'buy-machine':
      // gamePlayData = { numberOfMachines: admin.firestore.FieldValue.increment(amount) };
      assets.numberOfMachines += amount;
      // TODO: move this to listener later
      if (isMintWhitelist) gamePlayData = { whitelistAmountLeft: admin.firestore.FieldValue.increment(-amount) };
      if (referrerAddress) {
        // update discount
        const user = await firestore.collection('user').doc(userId).get();
        const currentDiscount = user.data().referralTotalDiscount;
        const referralTotalDiscount = currentDiscount
          ? admin.firestore.FieldValue.increment(referralDiscount)
          : referralDiscount;

        await user.ref.update({ referralTotalDiscount });

        // update reward
        const referrerSnapshot = await firestore
          .collection('user')
          .where('address', '==', referrerAddress)
          .limit(1)
          .get();

        if (!referrerSnapshot.size) break;
        const reward = getAccurate(value * referralConfig.referralBonus, 7);
        const userCurrentReward = referrerSnapshot.docs[0].data().referralTotalReward;
        const referralTotalReward = userCurrentReward ? admin.firestore.FieldValue.increment(reward) : reward;

        await referrerSnapshot.docs[0].ref.update({ referralTotalReward });
      }
      break;
    case 'buy-worker':
      gamePlayData = { numberOfWorkers: admin.firestore.FieldValue.increment(amount) };
      assets.numberOfWorkers += amount;
      break;
    case 'buy-building':
      gamePlayData = { numberOfBuildings: admin.firestore.FieldValue.increment(amount) };
      assets.numberOfBuildings += amount;
      break;
    case 'war-penalty':
      const { machinesDeadCount } = snapshot.data();
      assets.numberOfMachines -= machinesDeadCount;

      gamePlayData = {
        numberOfMachines: admin.firestore.FieldValue.increment(-machinesDeadCount),
        warDeployment: {
          ...warDeployment,
          numberOfMachinesToAttack: warDeployment.numberOfMachinesToAttack - machinesDeadCount,
        },
      };
      break;
    default:
      break;
  }

  /* recalculate `pendingReward` */
  if (userTokenGenerationRateChangedTypes.includes(type)) {
    const generatedReward = await calculateGeneratedReward(userId);
    gamePlayData.pendingReward = admin.firestore.FieldValue.increment(generatedReward);
    gamePlayData.startRewardCountingTime = admin.firestore.FieldValue.serverTimestamp();
  }

  const isGamePlayChanged = Object.keys(gamePlayData).length > 0;
  if (isGamePlayChanged) await userGamePlay.ref.update({ ...gamePlayData });
};

const sendUserBonus = async (userId, transactionId) => {
  const userSnapshot = await firestore.collection('user').doc(userId).get();
  const { address } = userSnapshot.data();
  const snapshot = await firestore.collection('transaction').doc(transactionId).get();
  const { type, amount } = snapshot.data();

  if (type === 'buy-machine') {
    const activeSeason = await getActiveSeason();
    const { reservePool, reservePoolReward } = activeSeason;
    const bonus = calculateReservePoolBonus(reservePool, reservePoolReward, amount);

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

    const { txnHash, status } = await claimTokenBonus({
      address,
      amount: BigInt(bonus * 1e6) * BigInt(1e12),
    });

    console.log('claimed bonus', { txnHash, status });

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
  // await sendUserBonus(userId, transactionId);
};

// for non web3 transactions: war-switch
// OR self-triggered web3 txns: war-penalty
export const validateNonWeb3Transaction = async ({ userId, transactionId }) => {
  // update txnHash and status for transaction doc in firestore
  await firestore.collection('transaction').doc(transactionId).update({
    status: 'Success',
  });

  // TODO: move this logic to trigger later
  await updateUserGamePlay(userId, transactionId);
};

export const claimToken = async ({ userId }) => {
  console.log('Claim token');
  const userSnapshot = await firestore.collection('user').doc(userId).get();
  const activeSeason = await getActiveSeason();
  if (activeSeason.status !== 'open') throw new Error('Season ended');

  if (userSnapshot.exists) {
    const { address, tokenBalance } = userSnapshot.data();
    const minted = await isMinted(address);
    if (!minted) throw new Error('You need to buy a Gangster before claiming');

    const gamePlaySnapshot = await firestore
      .collection('gamePlay')
      .where('userId', '==', userId)
      .where('seasonId', '==', activeSeason.id)
      .limit(1)
      .get();
    if (!gamePlaySnapshot.empty) {
      const { lastClaimTime, pendingReward } = gamePlaySnapshot.docs[0].data();

      const gamePlayId = gamePlaySnapshot.docs[0].id;
      const { claimGapInSeconds } = activeSeason;
      const now = Date.now();
      const diffInSeconds = (now - lastClaimTime.toDate().getTime()) / 1000;
      if (diffInSeconds < claimGapInSeconds) throw new Error('429: Too much claim request');

      const generatedReward = await calculateGeneratedReward(userId);

      const rawAmount = Number(pendingReward) + Number(generatedReward);
      const claimedAmount = Math.floor(rawAmount);

      await firestore
        .collection('gamePlay')
        .doc(gamePlayId)
        .update({
          lastClaimTime: admin.firestore.Timestamp.fromMillis(now),
          startRewardCountingTime: admin.firestore.Timestamp.fromMillis(now),
          pendingReward: rawAmount - claimedAmount,
        });
      await firestore
        .collection('user')
        .doc(userId)
        .update({
          tokenBalance: Number(tokenBalance) + claimedAmount,
        });

      const newTransaction = await firestore.collection('transaction').add({
        createdAt: admin.firestore.Timestamp.fromMillis(now),
        userId,
        seasonId: activeSeason.id,
        type: 'claim-token',
        token: 'FIAT',
        value: claimedAmount,
        status: 'Pending',
        txnHash: '',
      });

      return { address, claimedAmount, transactionId: newTransaction.id };
    }
  }
};

export const finishClaimToken = async ({ address, claimedAmount, transactionId }) => {
  const { txnHash, status } = await claimTokenTask({
    address,
    amount: BigInt(claimedAmount * 1e12) * BigInt(1e6),
  });
  console.log({ address, claimedAmount, transactionId, txnHash, status });
  if (txnHash && status) {
    await firestore.collection('transaction').doc(transactionId).update({
      txnHash,
      status,
    });
  }
};

// utils
export const calculateGeneratedReward = async (userId, { start, end, numberOfMachines, numberOfWorkers } = {}) => {
  const activeSeason = await getActiveSeason();
  if (activeSeason.status !== 'open') throw new Error('Season ended');

  const { machine, worker } = activeSeason;

  if (!start || !numberOfMachines || !numberOfWorkers) {
    const gamePlaySnapshot = await firestore
      .collection('gamePlay')
      .where('userId', '==', userId)
      .where('seasonId', '==', activeSeason.id)
      .limit(1)
      .get();

    const gamePlay = gamePlaySnapshot.docs[0];
    const {
      startRewardCountingTime,
      numberOfMachines: userMachinesCount,
      numberOfWorkers: userWorkersCount,
    } = gamePlay.data();

    if (!start) start = startRewardCountingTime.toDate().getTime();
    if (!numberOfMachines) numberOfMachines = userMachinesCount;
    if (!numberOfWorkers) numberOfWorkers = userWorkersCount;
  }

  const now = end || Date.now();
  const diffInDays = (now - start) / (24 * 60 * 60 * 1000);

  const generatedReward = diffInDays * (numberOfMachines * machine.dailyReward + numberOfWorkers * worker.dailyReward);
  return getAccurate(generatedReward, 3);
};

/* all txn types that change user's token generation rate */
const userTokenGenerationRateChangedTypes = ['buy-machine', 'buy-worker', 'war-penalty'];
const userNetworthChangedTypes = userTokenGenerationRateChangedTypes.concat('buy-building');
export const userPendingRewardChangedTypes = userTokenGenerationRateChangedTypes.concat('claim-token');
