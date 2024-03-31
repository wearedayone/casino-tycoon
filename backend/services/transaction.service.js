import { BigNumber } from 'alchemy-sdk';
import { formatEther, parseEther } from '@ethersproject/units';

import admin, { firestore } from '../configs/firebase.config.js';
import alchemy from '../configs/alchemy.config.js';
import { getActiveSeason, getActiveSeasonId, updateSeasonSnapshotSchedule } from './season.service.js';
import { getLeaderboard } from './gamePlay.service.js';
import {
  claimToken as claimTokenTask,
  decodeTokenTxnLogs,
  isMinted,
  signMessageBuyGoon,
  signMessageBuyGangster,
  signMessageRetire,
  getTotalSold,
  getTokenBalance,
} from './worker.service.js';
import {
  calculateNextBuildingBuyPriceBatch,
  calculateNextWorkerBuyPriceBatch,
  calculateNextBuildingBuyPrice,
  calculateNextWorkerBuyPrice,
  calculateNewEstimatedEndTimeUnix,
} from '../utils/formulas.js';
import { getAccurate } from '../utils/math.js';
import logger from '../utils/logger.js';
import environments from '../utils/environments.js';

const { SYSTEM_ADDRESS } = environments;

export const initTransaction = async ({ userId, type, ...data }) => {
  logger.info(`init transaction user:${userId} - type:${type}`);
  const activeSeason = await getActiveSeason();

  if (type !== 'withdraw' && data.token !== 'NFT' && activeSeason.status !== 'open')
    throw new Error('API error: Season ended');

  if (type === 'buy-machine') {
    if (data.amount > activeSeason.machine.maxPerBatch) throw new Error('API error: Bad request - over max per batch');
  }

  if (type === 'buy-worker') {
    if (data.amount > activeSeason.worker.maxPerBatch) throw new Error('API error: Bad request - over max per batch');
  }

  if (type === 'buy-building') {
    if (data.amount > activeSeason.building.maxPerBatch) throw new Error('API error: Bad request - over max per batch');
  }

  const { machine, machineSold, workerSold, buildingSold, worker, building, referralConfig, prizePoolConfig } =
    activeSeason;
  const txnData = {};
  const now = Date.now();
  const startSalePeriod = now - 12 * 60 * 60 * 1000;
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
      const { isWhitelisted, whitelistAmountMinted } = gamePlaySnapshot.docs[0].data();
      const { inviteCode } = userSnapshot.data();
      let userReferralDiscount = 0;
      const whitelistAmountLeft = machine.maxWhitelistAmount - whitelistAmountMinted;
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
      break;
    case 'buy-worker':
      txnData.amount = data.amount;
      txnData.token = 'FIAT';
      txnData.currentSold = workerSold;
      const workerTxns = await firestore
        .collection('transaction')
        .where('seasonId', '==', activeSeason.id)
        .where('type', '==', 'buy-worker')
        .where('status', '==', 'Success')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(startSalePeriod))
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
        .where('seasonId', '==', activeSeason.id)
        .where('type', '==', 'buy-building')
        .where('status', '==', 'Success')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(startSalePeriod))
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
    case 'retire':
      const leaderboard = await getLeaderboard(userId);
      const { reputationReward } = leaderboard.find(({ isUser }) => isUser);
      const retireReward = getAccurate(reputationReward * (1 - prizePoolConfig.earlyRetirementTax));
      txnData.value = retireReward;
      txnData.token = 'ETH';
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
      const time = Math.floor(Date.now() / 1000);
      const mintFunction = type === 'buy-worker' ? 'buyGoon' : 'buySafeHouse';

      const { address } = userData.data();
      const totalSold = await getTotalSold(type, address);
      const signature = await signMessageBuyGoon({
        address: address,
        amount: txnData.amount,
        value: parseEther(txnData.value + ''),
        totalAmount: totalSold,
        time,
        nonce,
        mintFunction,
      });
      return { id: newTransaction.id, ...transaction, totalSold, time, signature };
    }
  }

  if (type === 'buy-machine') {
    const userData = await firestore.collection('user').doc(userId).get();
    if (userData.exists) {
      const { address } = userData.data();
      const time = Math.floor(Date.now() / 1000);
      const signedData = {
        address,
        amount: txnData.amount,
        time,
        nonce,
        mintFunction: data.mintFunction,
      };
      if (txnData.referrerAddress) signedData.referral = txnData.referrerAddress;
      const signature = await signMessageBuyGangster(signedData);
      return { id: newTransaction.id, ...transaction, time, signature };
    }
  }
  if (type === 'retire') {
    const userData = await firestore.collection('user').doc(userId).get();
    if (userData.exists) {
      const { address } = userData.data();
      const signedData = { address, reward: txnData.value, nonce };
      const signature = await signMessageRetire(signedData);
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
    if (!txnSnapshot.empty) throw new Error('API error: Existed txnHash');

    const tx = await alchemy.core.getTransaction(txnHash);
    console.log({ userId, transactionId, txnHash, tx });

    const receipt = await tx.wait();
    // console.log(`transaction ${txnHash}`, tx, 'receipt', receipt);
    const { from, to, status, logs } = receipt;

    if (status !== 1) throw new Error('API error: Invalid txn status');

    const userSnapshot = await firestore.collection('user').doc(userId).get();
    const { address } = userSnapshot.data();

    if (address?.toLowerCase() !== from.toLowerCase() && SYSTEM_ADDRESS?.toLowerCase() !== from.toLowerCase())
      throw new Error(`API error: Bad request - invalid sender, txn: ${JSON.stringify(receipt)}`);

    const snapshot = await firestore.collection('transaction').doc(transactionId).get();
    const { type, value, token } = snapshot.data();

    const transactionValue = token === 'ETH' ? tx.value : BigNumber.from(logs[0].data);
    const bnValue = parseEther(value.toString());
    console.log({ logdata: logs[0]?.data, value, bnValue });

    const activeSeason = await getActiveSeason();
    const { tokenAddress: TOKEN_ADDRESS } = activeSeason || {};

    if (type === 'withdraw') {
      if (token === 'FIAT' && to.toLowerCase() !== TOKEN_ADDRESS.toLowerCase())
        throw new Error(`API error: Bad request - invalid receiver for ${type}, txn: ${JSON.stringify(receipt)}`);

      if (!bnValue.eq(transactionValue))
        throw new Error(
          `API error: Bad request - Value doesnt match, ${JSON.stringify({ transactionValue, bnValue })}`
        );
    }

    if (['buy-worker', 'buy-building'].includes(type)) {
      if (to.toLowerCase() !== TOKEN_ADDRESS.toLowerCase())
        throw new Error(`API error: Bad request - invalid receiver for ${type}, txn: ${JSON.stringify(receipt)}`);

      const decodedData = await decodeTokenTxnLogs('Transfer', logs[0]);
      if (decodedData.to.toLowerCase() !== SYSTEM_ADDRESS.toLowerCase())
        throw new Error(`API error: Bad request - invalid token receiver for ${type}, txn: ${JSON.stringify(receipt)}`);
      console.log({ value, bnValue, transactionValue });
      console.log(bnValue.eq(transactionValue));
      if (!bnValue.eq(transactionValue))
        throw new Error(
          `API error: Bad request - Value doesnt match, ${JSON.stringify({ transactionValue, bnValue })}`
        );
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
  const { estimatedEndTime, timeStepInMinutes } = activeSeason;
  const estimatedEndTimeUnix = estimatedEndTime.toDate().getTime();

  let newData;
  switch (type) {
    case 'buy-machine':
      newData = {
        estimatedEndTime: admin.firestore.Timestamp.fromMillis(
          calculateNewEstimatedEndTimeUnix(estimatedEndTimeUnix, amount, timeStepInMinutes)
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
  const warDeploymentSnapshot = await firestore
    .collection('warDeployment')
    .where('seasonId', '==', activeSeason.id)
    .where('userId', '==', userId)
    .limit(1)
    .get();

  const userGamePlay = gamePlaySnapshot.docs[0];
  const warDeployment = warDeploymentSnapshot.docs[0]?.data() || {};
  logger.debug(`userGamePlay before update: ${JSON.stringify(userGamePlay.data())}`);
  const { numberOfWorkers, numberOfMachines, numberOfBuildings } = userGamePlay.data();
  const assets = {
    numberOfBuildings,
    numberOfMachines,
    numberOfWorkers,
  };

  let gamePlayData = {};
  let warDeploymentData = {};
  switch (type) {
    case 'buy-machine':
      // gamePlayData = { numberOfMachines: admin.firestore.FieldValue.increment(amount) };
      assets.numberOfMachines += amount;
      // TODO: move this to listener later
      if (isMintWhitelist) gamePlayData = { whitelistAmountMinted: admin.firestore.FieldValue.increment(amount) };
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
      };
      warDeploymentData = {
        numberOfMachinesToAttack: warDeployment.numberOfMachinesToAttack - machinesDeadCount,
      };
      break;
    case 'retire':
      assets.numberOfMachines = 0;
      assets.numberOfBuildings = 0;
      assets.numberOfWorkers = 0;
      gamePlayData = {
        ...assets,
        active: false,
      };
      warDeploymentData = {
        numberOfMachinesToEarn: 0,
        numberOfMachinesToAttack: 0,
        numberOfMachinesToDefend: 0,
        attackUserId: null,
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

  const isWarDeploymentChanged = Object.keys(warDeploymentData).length > 0;
  if (isWarDeploymentChanged) {
    const warDeploymentSnapshot = await admin
      .firestore()
      .collection('warDeployment')
      .where('userId', '==', userId)
      .where('seasonId', '==', activeSeason.id)
      .limit(1)
      .get();

    if (!warDeploymentSnapshot.empty) {
      await warDeploymentSnapshot.docs[0].ref.update({ ...warDeploymentData });
    }
  }
};

export const validateTxnHash = async ({ userId, transactionId, txnHash }) => {
  const valid = await validateBlockchainTxn({ userId, transactionId, txnHash });
  if (!valid) throw new Error('API error: Bad request - Invalid txn');

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
  if (activeSeason.status !== 'open') throw new Error('API error: Season ended');

  if (userSnapshot.exists) {
    const { address, tokenBalance } = userSnapshot.data();
    const minted = await isMinted(address);
    if (!minted) throw new Error('API error: You need to buy a Gangster before claiming');

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
      if (diffInSeconds < claimGapInSeconds) throw new Error('API error: 429 - Too much claim request');

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
    amount: BigInt(parseEther(claimedAmount.toString()).toString()),
  });
  console.log({ address, claimedAmount, transactionId, txnHash, status });
  if (txnHash && status) {
    await firestore.collection('transaction').doc(transactionId).update({
      txnHash,
      status,
    });
  } else {
    // rollback claim when transaction fail:
    const transaction = await firestore.collection('transaction').doc(transactionId).get();
    const { seasonId, status, userId } = transaction.data();

    if (status !== 'Success') {
      const user = await firestore.collection('user').doc(userId).get();
      if (user.exists) {
        const { address } = user.data();
        const balance = await getTokenBalance({ address });
        await firestore
          .collection('user')
          .doc(userId)
          .update({
            tokenBalance: Number(formatEther(balance)),
          });
        const gamePlay = await firestore
          .collection('gamePlay')
          .where('userId', '==', userId)
          .where('seasonId', '==', seasonId)
          .limit(1)
          .get();

        if (!gamePlay.empty) {
          const { pendingReward } = gamePlay.docs[0].data();
          await firestore
            .collection('gamePlay')
            .doc(gamePlay.docs[0].id)
            .update({
              lastClaimTime: admin.firestore.Timestamp.fromMillis(1708451011000),
              pendingReward: pendingReward + claimedAmount,
            });
        }
      }
    }
  }
};

// export const getWorkerPriceChart = async ({ timeMode, blockMode }) => {
//   if (!['1d', '5d'].includes(timeMode)) throw new Error('API error: Invalid time mode');
//   if (!['5m', '10m', '15m', '30m', '1h', '2h', '4h', '6h'].includes(blockMode))
//     throw new Error('API error: Invalid block mode');

//   const activeSeason = await getActiveSeason();
//   const now = Date.now();
//   const numberOfDays = timeMode === '1d' ? 1 : 5;
//   const startTimeUnix = now - numberOfDays * 24 * 60 * 60 * 1000;

//   const potentialTxnSnapshot = await firestore
//     .collection('transaction')
//     .where('seasonId', '==', activeSeason.id)
//     .where('type', '==', 'buy-worker')
//     .where('status', '==', 'Success')
//     .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(startTimeUnix - 12 * 60 * 60 * 1000))
//     .orderBy('createdAt', 'asc')
//     .get();

//   const potentialTxns = potentialTxnSnapshot.docs.map((doc) => ({
//     id: doc.id,
//     ...doc.data(),
//     createdAt: doc.data().createdAt.toDate().getTime(),
//   }));
//   const txns = potentialTxns.filter((txn) => txn.createdAt >= startTimeUnix);

//   const gap = gaps[blockMode];
//   const startBlockTimes = [startTimeUnix];
//   let nextStartTime = startTimeUnix + gap;
//   while (nextStartTime < now) {
//     startBlockTimes.push(nextStartTime);
//     nextStartTime += gap;
//   }

//   const avgPrices = [];
//   for (let i = 0; i < startBlockTimes.length; i++) {
//     const startTime = startBlockTimes[i];
//     const nextStartTime = startBlockTimes[i + 1];
//     const firstTxn = txns.find(
//       (item) => item.createdAt > startTime && (!nextStartTime || item.createdAt < nextStartTime)
//     );

//     if (firstTxn) {
//       avgPrices.push({ startAt: startTime, value: firstTxn.prices[0] });
//     } else {
//       const { worker } = activeSeason;

//       const startSalePeriod = startTime - 12 * 60 * 60 * 1000;
//       const workerTxns = potentialTxns.filter(
//         (txn) => txn.createdAt >= startSalePeriod && (!nextStartTime || txn.createdAt < nextStartTime)
//       );

//       const workerSalesLastPeriod = workerTxns.reduce((total, doc) => total + doc.amount, 0);
//       const workerPrices = calculateNextWorkerBuyPriceBatch(
//         workerSalesLastPeriod,
//         worker.targetDailyPurchase,
//         worker.targetPrice,
//         worker.basePrice,
//         1
//       );

//       avgPrices.push({ startAt: startTime, value: workerPrices.prices[0] });
//     }
//   }

//   return avgPrices;
// };

// export const getBuildingPriceChart = async ({ timeMode, blockMode }) => {
//   if (!['1d', '5d'].includes(timeMode)) throw new Error('API error: Invalid time mode');
//   if (!['5m', '10m', '15m', '30m', '1h', '2h', '4h', '6h'].includes(blockMode))
//     throw new Error('API error: Invalid block mode');

//   const activeSeason = await getActiveSeason();
//   const now = Date.now();
//   const numberOfDays = timeMode === '1d' ? 1 : 5;
//   const startTimeUnix = now - numberOfDays * 24 * 60 * 60 * 1000;

//   const potentialTxnSnapshot = await firestore
//     .collection('transaction')
//     .where('seasonId', '==', activeSeason.id)
//     .where('type', '==', 'buy-building')
//     .where('status', '==', 'Success')
//     .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(startTimeUnix - 12 * 60 * 60 * 1000))
//     .orderBy('createdAt', 'asc')
//     .get();

//   const potentialTxns = potentialTxnSnapshot.docs.map((doc) => ({
//     id: doc.id,
//     ...doc.data(),
//     createdAt: doc.data().createdAt.toDate().getTime(),
//   }));
//   const txns = potentialTxns.filter((txn) => txn.createdAt >= startTimeUnix);

//   const gap = gaps[blockMode];
//   const startBlockTimes = [startTimeUnix];
//   let nextStartTime = startTimeUnix + gap;
//   while (nextStartTime < now) {
//     startBlockTimes.push(nextStartTime);
//     nextStartTime += gap;
//   }

//   const avgPrices = [];
//   for (let i = 0; i < startBlockTimes.length; i++) {
//     const startTime = startBlockTimes[i];
//     const nextStartTime = startBlockTimes[i + 1];
//     const firstTxn = txns.find(
//       (item) => item.createdAt > startTime && (!nextStartTime || item.createdAt < nextStartTime)
//     );

//     if (firstTxn) {
//       avgPrices.push({ startAt: startTime, value: firstTxn.prices[0] });
//     } else {
//       const { building } = activeSeason;

//       const startSalePeriod = startTime - 12 * 60 * 60 * 1000;
//       const buildingTxns = potentialTxns.filter(
//         (txn) => txn.createdAt >= startSalePeriod && (!nextStartTime || txn.createdAt < nextStartTime)
//       );

//       const buildingSalesLastPeriod = buildingTxns.reduce((total, doc) => total + doc.amount, 0);
//       const buildingPrices = calculateNextBuildingBuyPriceBatch(
//         buildingSalesLastPeriod,
//         building.targetDailyPurchase,
//         building.targetPrice,
//         building.basePrice,
//         1
//       );

//       avgPrices.push({ startAt: startTime, value: buildingPrices.prices[0] });
//     }
//   }

//   return avgPrices;
// };

export const getBuildingPriceChart = async ({ timeMode }) => {
  if (!['1d', '5d'].includes(timeMode)) throw new Error('API error: Invalid time mode');

  const activeSeason = await getActiveSeason();
  const now = Date.now();
  const numberOfDays = timeMode === '1d' ? 1 : 5;
  const startTimeUnix = now - numberOfDays * 24 * 60 * 60 * 1000;

  const snapshot = await firestore
    .collection('building-txn-prices')
    .where('seasonId', '==', activeSeason.id)
    .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(startTimeUnix))
    .orderBy('createdAt', 'asc')
    .get();

  const txns = snapshot.docs.map((doc) => ({
    createdAt: doc.data().createdAt.toDate().getTime(),
    value: doc.data().avgPrice,
  }));

  const { building } = activeSeason;
  const last12hTxns = await firestore
    .collection('transaction')
    .where('seasonId', '==', activeSeason.id)
    .where('type', '==', 'buy-building')
    .where('status', '==', 'Success')
    .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(now - 12 * 60 * 60 * 1000))
    .get();

  const buildingSalesLastPeriod = last12hTxns.docs.reduce((total, doc) => total + doc.data().amount, 0);
  const currentPrice = calculateNextBuildingBuyPrice(
    buildingSalesLastPeriod,
    building.targetDailyPurchase,
    building.targetPrice,
    building.basePrice
  );

  return [...txns, { createdAt: now, value: currentPrice }];
};

export const getWorkerPriceChart = async ({ timeMode }) => {
  if (!['1d', '5d'].includes(timeMode)) throw new Error('API error: Invalid time mode');

  const activeSeason = await getActiveSeason();
  const now = Date.now();
  const numberOfDays = timeMode === '1d' ? 1 : 5;
  const startTimeUnix = now - numberOfDays * 24 * 60 * 60 * 1000;

  const snapshot = await firestore
    .collection('worker-txn-prices')
    .where('seasonId', '==', activeSeason.id)
    .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(startTimeUnix))
    .orderBy('createdAt', 'asc')
    .get();

  const txns = snapshot.docs.map((doc) => ({
    createdAt: doc.data().createdAt.toDate().getTime(),
    value: doc.data().avgPrice,
  }));

  const { worker } = activeSeason;
  const last12hTxns = await firestore
    .collection('transaction')
    .where('seasonId', '==', activeSeason.id)
    .where('type', '==', 'buy-worker')
    .where('status', '==', 'Success')
    .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(now - 12 * 60 * 60 * 1000))
    .get();

  const workerSalesLastPeriod = last12hTxns.docs.reduce((total, doc) => total + doc.data().amount, 0);
  const currentPrice = calculateNextWorkerBuyPrice(
    workerSalesLastPeriod,
    worker.targetDailyPurchase,
    worker.targetPrice,
    worker.basePrice
  );

  return [...txns, { createdAt: now, value: currentPrice }];
};

// utils
export const calculateGeneratedReward = async (userId, { start, end, numberOfMachines, numberOfWorkers } = {}) => {
  const activeSeason = await getActiveSeason();
  if (activeSeason.status !== 'open') throw new Error('API error: Season ended');

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
const userTokenGenerationRateChangedTypes = ['buy-machine', 'buy-worker', 'war-penalty', 'retire'];
const userNetworthChangedTypes = userTokenGenerationRateChangedTypes.concat('buy-building');
export const userPendingRewardChangedTypes = userTokenGenerationRateChangedTypes.concat('claim-token');
