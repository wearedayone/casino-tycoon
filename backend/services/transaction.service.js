import { formatEther, parseEther } from '@ethersproject/units';
import moment from 'moment';

import admin, { firestore } from '../configs/firebase.config.js';
import quickNode from '../configs/quicknode.config.js';
import { getActiveSeason, getActiveSeasonId } from './season.service.js';
import { getLeaderboard, getUserGamePlay, calculateGeneratedXToken } from './gamePlay.service.js';
import {
  claimToken as claimTokenTask,
  decodeGameTxnLogs,
  isMinted,
  signMessageBuyGangster,
  signMessageRetire,
  signMessageDailySpin,
  getTokenBalance,
  getNoGangster,
  convertEthInputToToken,
  signMessageBuyAsset,
  getLastBuyTime,
} from './worker.service.js';
import {
  calculateNextBuildingBuyPriceBatch,
  calculateNextWorkerBuyPriceBatch,
  calculateNextBuildingBuyPrice,
  calculateNextWorkerBuyPrice,
  calculateSpinPrice,
  getTokenFromXToken,
  calculateNewEstimatedEndTimeUnix,
} from '../utils/formulas.js';
import { getAccurate } from '../utils/math.js';
import logger from '../utils/logger.js';

const MAX_RETRY = 3;

export const initTransaction = async ({ userId, type, ...data }) => {
  logger.info(`init transaction user:${userId} - type:${type}`);
  const activeSeason = await getActiveSeason();

  const utcDate = moment().utc().format('DD/MM/YYYY');
  const todayStartTime = moment(`${utcDate} 00:00:00`, 'DD/MM/YYYY HH:mm:ss').utc(true).toDate().getTime();

  if (type === 'buy-machine') {
    if (data.amount > activeSeason.machine.maxPerBatch) throw new Error('API error: Bad request - over max per batch');
  }

  if (type === 'buy-worker') {
    if (!['FIAT'].includes(data.token)) throw new Error('API error: Bad request - invalid token');
    if (data.amount > activeSeason.worker.maxPerBatch) throw new Error('API error: Bad request - over max per batch');
  }

  if (type === 'buy-building') {
    if (!['FIAT'].includes(data.token)) throw new Error('API error: Bad request - invalid token');
    if (data.amount > activeSeason.building.maxPerBatch) throw new Error('API error: Bad request - over max per batch');
  }
  let userSnapshot;
  if (['buy-machine', 'buy-building', 'buy-worker'].includes(type)) {
    userSnapshot = await firestore.collection('user').doc(userId).get();
  }

  if (type === 'daily-spin') {
    const userGamePlay = await getUserGamePlay(userId);
    const { numberOfSpins } = userGamePlay;
    if (!numberOfSpins) throw new Error('API error: Run out of spins');
    await firestore
      .collection('gamePlay')
      .doc(userGamePlay.id)
      .update({ numberOfSpins: admin.firestore.FieldValue.increment(-1) });
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
      txnData.token = 'FIAT';
      txnData.currentSold = machineSold;

      const gamePlaySnapshot = await firestore
        .collection('gamePlay')
        .where('userId', '==', userId)
        .where('seasonId', '==', activeSeason.id)
        .limit(1)
        .get();
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
      const unitPriceInToken = (await convertEthInputToToken(unitPrice)).amount;

      const estimatedPrice = data.amount * unitPriceInToken;
      txnData.value = estimatedPrice;
      txnData.prices = Array.from({ length: data.amount }, () => unitPriceInToken);
      break;
    case 'buy-worker':
      txnData.amount = data.amount;
      txnData.token = data.token;
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
      txnData.token = data.token;
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
      txnData.gainedReputation = data.gainedReputation;
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
    case 'daily-spin':
      const userGamePlay = await firestore
        .collection('gamePlay')
        .where('userId', '==', userId)
        .where('seasonId', '==', activeSeason.id)
        .limit(1)
        .get();
      const gamePlay = userGamePlay.docs[0]?.data();
      txnData.value = calculateSpinPrice(gamePlay?.networth || 0);
      txnData.token = 'FIAT';
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
      const buyType = type === 'buy-worker' ? 1 : 2;
      const web3TokenValue = txnData.token === 'FIAT' ? txnData.value : 0;

      const { address } = userData.data();
      const lastB = await getLastBuyTime({ address, type: buyType });
      const signature = await signMessageBuyAsset({
        address: address,
        type: buyType,
        amount: txnData.amount,
        value: parseEther(web3TokenValue + ''),
        lastB,
        time,
        nonce,
      });
      return { id: newTransaction.id, ...transaction, type: buyType, lastB, time, signature };
    }
  }

  if (type === 'buy-machine') {
    const userData = await firestore.collection('user').doc(userId).get();
    if (userData.exists) {
      const { address } = userData.data();
      const time = Math.floor(Date.now() / 1000);
      const nGangster = (await getNoGangster({ address })).toNumber();
      const value = parseEther(txnData.value.toString()).toBigInt();
      const signedData = {
        address,
        amount: txnData.amount,
        value,
        time,
        nGangster,
        nonce,
        bType: 1,
        referral: txnData.referrerAddress ?? '0xb5987682d601354eA1e8620253191Fb4e43024e6',
      };
      const signature = await signMessageBuyGangster(signedData);
      return {
        id: newTransaction.id,
        ...transaction,
        nGangster,
        bType: 1,
        time,
        referrerAddress: signedData.referral,
        signature,
      };
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

  if (type === 'daily-spin') {
    const userData = await firestore.collection('user').doc(userId).get();
    if (userData.exists) {
      const { address } = userData.data();
      const time = Math.floor(Date.now() / 1000);
      const spinType = 1;
      const amount = 1;
      const lastSpin = 0;
      const value = parseEther(txnData.value + '');
      const signedData = { address, spinType, amount, value, lastSpin, time, nonce };
      const signature = await signMessageDailySpin(signedData);
      return { id: newTransaction.id, ...transaction, spinType, amount, lastSpin, time, nonce, signature };
    }
  }

  return { id: newTransaction.id, ...transaction };
};

export const buyAssetsWithXToken = async ({ userId, type, amount }) => {
  if (!['worker', 'building'].includes(type)) throw new Error('API error: Invalid txn type');

  const activeSeason = await getActiveSeason();
  const {
    status,
    workerSold,
    buildingSold,
    worker,
    building,
    estimatedEndTime,
    endTimeConfig: { timeDecrementInSeconds },
  } = activeSeason;
  if (status !== 'open') throw new Error('API error: Season is ended');

  const user = await firestore.collection('user').doc(userId).get();
  if (!user.exists) throw new Error('API error: Bad credential');
  const { xTokenBalance } = user.data();

  const gamePlay = await getUserGamePlay(userId);
  if (!gamePlay) throw new Error('API error: No game play');
  if (!gamePlay.active) throw new Error('API error: Inactive user');

  const generatedXToken = await calculateGeneratedXToken(userId);
  const currentTotalBalance = xTokenBalance + generatedXToken;

  const now = Date.now();
  const startSalePeriod = now - 12 * 60 * 60 * 1000;
  const txnData = {};
  txnData.amount = amount;
  txnData.token = 'xGANG';

  if (type === 'worker') {
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
      amount
    );
    txnData.value = workerPrices.total;
    txnData.prices = workerPrices.prices;
  }

  if (type === 'building') {
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
      amount
    );
    txnData.value = buildingPrices.total;
    txnData.prices = buildingPrices.prices;
  }

  if (currentTotalBalance < txnData.value) throw new Error('API error: Insufficient xGANG');

  const batch = firestore.batch();

  // create txn
  const txnRef = firestore.collection('transaction').doc();
  batch.create(txnRef, {
    userId,
    seasonId: activeSeason.id,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    type: `buy-${type}`,
    status: 'Success',
    ...txnData,
  });

  // update gamePlay
  const gamePlayRef = firestore.collection('gamePlay').doc(gamePlay.id);
  const gamePlayData =
    type === 'worker'
      ? { numberOfWorkers: admin.firestore.FieldValue.increment(amount) }
      : { numberOfBuildings: admin.firestore.FieldValue.increment(amount) };
  batch.update(gamePlayRef, { ...gamePlayData, startXTokenCountingTime: admin.firestore.FieldValue.serverTimestamp() });

  // update user
  batch.update(user.ref, { xTokenBalance: currentTotalBalance - txnData.value });

  // update season
  const seasonData =
    type === 'worker'
      ? { workerSold: admin.firestore.FieldValue.increment(amount) }
      : { buildingSold: admin.firestore.FieldValue.increment(amount) };

  if (type === 'building') {
    const currentEndTimeUnix = estimatedEndTime.toDate().getTime();
    const newEndTimeUnix = calculateNewEstimatedEndTimeUnix(currentEndTimeUnix, amount, -timeDecrementInSeconds);
    seasonData.estimatedEndTime = admin.firestore.Timestamp.fromMillis(newEndTimeUnix);
  }
  const seasonRef = firestore.collection('season').doc(activeSeason.id);
  batch.update(seasonRef, seasonData);

  let retry = 0;
  let isSuccess = false;
  while (retry < MAX_RETRY && !isSuccess) {
    try {
      logger.info(`Start buy-${type}. Retry ${retry++} times. ${JSON.stringify({ userId, type, amount })}`);
      await batch.commit();
      isSuccess = true;
    } catch (err) {
      logger.error(`Unsuccessful buy-${type} txn: ${JSON.stringify(err)}`);
    }
  }

  if (!isSuccess) {
    throw new Error('API error: Error when buying assets');
  }
};

export const validateDailySpinTxnAndReturnSpinResult = async ({ userId, transactionId, txnHash }) => {
  // spin txn validations:
  // - txnHash not used
  // - user has one pending txn with transactionId
  // - user call api === txn owner
  // - user address === txn from address
  // - game address === txn to address
  // - txn status === 1
  // - game contract burn correct amount of token
  const existed = await firestore.collection('transaction').where('txnHash', '==', txnHash).get();
  if (!existed.empty) throw new Error('API error: Transaction duplicated');

  const snapshot = await firestore.collection('transaction').doc(transactionId).get();
  if (!snapshot.exists) throw new Error('API error: Not found');

  const { userId: txnUserId, status, value } = snapshot.data();
  if (txnUserId !== userId) throw new Error('API error: Bad credential');
  if (status !== 'Pending') throw new Error('API error: Bad request');

  const receipt = await quickNode.waitForTransaction(txnHash);
  const { from, to, status: txnStatus, logs } = receipt;
  if (txnStatus !== 1) throw new Error('API error: Invalid txn status');

  console.log('validate spin txn logs', { logs });

  const activeSeason = await getActiveSeason();

  const {
    id: activeSeasonId,
    gameAddress,
    spinConfig: { spinRewards },
  } = activeSeason;
  const user = await firestore.collection('user').doc(userId).get();
  const { address } = user.data();
  if (from.toLowerCase() !== address.toLowerCase()) throw new Error('API error: Bad credential');
  if (to.toLowerCase() !== gameAddress.toLowerCase()) throw newError('API error: Bad credential');

  const decodedData = await decodeGameTxnLogs('DailySpin', logs[1]);
  const price = Number(formatEther(decodedData[1]));
  if (price !== value) throw new Error('API error: Mismatching price');

  const { reward, index } = randomSpinResult(spinRewards);

  if (reward.type === 'house') {
    const gamePlaySnapshot = await firestore
      .collection('gamePlay')
      .where('userId', '==', userId)
      .where('seasonId', '==', activeSeasonId)
      .limit(1)
      .get();
    if (!gamePlaySnapshot.empty) {
      await gamePlaySnapshot.docs[0].ref.update({
        numberOfBuildings: admin.firestore.FieldValue.increment(reward.value),
      });
    }

    await snapshot.ref.update({ txnHash, status: 'Success', reward: { type: reward.type, value: reward.value } });
  }

  if (reward.type === 'point') {
    const userSnapshot = await firestore.collection('user').doc(userId).get();
    if (userSnapshot.exists) {
      const { address } = userSnapshot.data();

      const { txnHash, status } = await claimTokenTask({
        address,
        amount: BigInt(parseEther(reward.value.toString()).toString()),
      });

      await snapshot.ref.update({
        txnHash,
        status: 'Success',
        reward: { type: reward.type, value: reward.value, rewardTxnHash: txnHash, rewardTxnStatus: status },
      });
    }
  }

  return index;
};

const randomSpinResult = (spinRewards) => {
  const randomPercentage = Math.random();

  let cumulativePercentage = 0;

  spinRewards.sort((item1, item2) => item1.order - item2.order);

  for (let i = 0; i < spinRewards.length; i++) {
    const reward = spinRewards[i];
    cumulativePercentage += reward.percentage;

    if (cumulativePercentage >= randomPercentage) {
      return { reward, index: i };
    }
  }
};

const validateBlockchainTxn = async ({ userId, transactionId, txnHash }) => {
  try {
    // validate if this txnHash
    // - doesnt belongs to transaction in firestore - OK
    // - status === 1 - OK
    // - comes from user wallet address - OK
    // - has the same token as the transaction doc in firestore - OK
    // - has the same value as the transaction doc in firestore - OK
    const txnSnapshot = await firestore.collection('transaction').where('txnHash', '==', txnHash).limit(1).get();
    if (!txnSnapshot.empty) throw new Error('API error: Existed txnHash');

    const tx = await quickNode.send('eth_getTransactionByHash', [txnHash]);
    console.log({ userId, transactionId, txnHash, tx });

    const receipt = await quickNode.waitForTransaction(txnHash);
    const { from, to, status, logs } = receipt;

    if (status !== 1) throw new Error('API error: Invalid txn status');

    const userSnapshot = await firestore.collection('user').doc(userId).get();
    const { address } = userSnapshot.data();

    if (address?.toLowerCase() !== from.toLowerCase())
      throw new Error(`API error: Bad request - invalid sender, txn: ${JSON.stringify(receipt)}`);

    const snapshot = await firestore.collection('transaction').doc(transactionId).get();
    const { type, value, token } = snapshot.data();

    const transactionValue = token === 'ETH' ? tx.value : token === 'FIAT' ? BigInt(logs[0].data) : parseEther('0');
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

    return true;
  } catch (err) {
    logger.error(
      `Error: Detect invalid txn, error: ${err.message}, ${JSON.stringify({ userId, transactionId, txnHash })}`
    );
  }
};

const updateUserBalance = async (userId) => {
  const userSnapshot = await firestore.collection('user').doc(userId).get();

  if (userSnapshot.exists) {
    const { address, ETHBalance } = userSnapshot.data();
    const value = await quickNode.getBalance(address, 'latest');
    if (ETHBalance !== formatEther(value)) {
      await firestore
        .collection('user')
        .doc(userId)
        .update({
          ETHBalance: formatEther(value),
        });
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

  await updateUserBalance(userId);
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
    .where('createdAt', '<', admin.firestore.Timestamp.fromMillis(now))
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
    .where('createdAt', '<', admin.firestore.Timestamp.fromMillis(now))
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
    .where('createdAt', '<', admin.firestore.Timestamp.fromMillis(now))
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
    .where('createdAt', '<', admin.firestore.Timestamp.fromMillis(now))
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

export const convertXTokenToToken = async ({ userId, amount }) => {
  // validation
  if (!amount || !Number(amount)) throw new Error('API error: Bad request');

  // reduce xTokenBalance
  await firestore.runTransaction(async (transaction) => {
    // lock user doc && gamePlay doc
    const userRef = firestore.collection('user').doc(userId);
    const user = await transaction.get(userRef);

    const { xTokenBalance } = user.data();

    const gamePlayId = (await getUserGamePlay(userId)).id;
    const gamePlayRef = firestore.collection('gamePlay').doc(gamePlayId);
    const gamePlay = await transaction.get(gamePlayRef);

    const { active, numberOfWorkers, startXTokenCountingTime, lastTimeSwapXToken } = gamePlay.data();
    if (!active) throw new Error('API error: Inactive user');
    const { worker, swapXTokenGapInSeconds } = await getActiveSeason();

    const now = Date.now();
    const diff = Math.round((now - lastTimeSwapXToken.toDate().getTime()) / 1000);
    if (diff < swapXTokenGapInSeconds) throw new Error('API error: Too many attempts');

    const start = startXTokenCountingTime.toDate().getTime();
    const diffInDays = (now - start) / (24 * 60 * 60 * 1000);
    const generatedXToken = Math.round(diffInDays * (numberOfWorkers * worker.dailyReward) * 1000) / 1000;
    const currentXTokenBalance = xTokenBalance + generatedXToken;

    if (currentXTokenBalance < amount) throw new Error('API error: Insufficient xGANG');

    transaction.update(userRef, { xTokenBalance: currentXTokenBalance - amount });
    transaction.update(gamePlayRef, { startXTokenCountingTime: admin.firestore.FieldValue.serverTimestamp() });
  });

  // create txn
  await firestore
    .collection('system')
    .doc('data')
    .update({
      nonce: admin.firestore.FieldValue.increment(1),
    });
  const systemData = await firestore.collection('system').doc('data').get();
  const { nonce } = systemData.data();
  const activeSeasonId = await getActiveSeasonId();
  const txn = await firestore.collection('transaction').add({
    userId,
    seasonId: activeSeasonId,
    nonce,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    type: 'swap-x-token',
    status: 'Pending',
    token: 'xGANG',
    value: amount,
    txnHash: '',
  });

  // call contract to mint
  const user = await firestore.collection('user').doc(userId).get();
  const receiveAmount = getTokenFromXToken(amount);
  const { txnHash, status } = await claimTokenTask({
    address: user.data().address,
    amount: BigInt(parseEther(receiveAmount.toString()).toString()),
  });

  // update txn && user && gamePlay
  await firestore.collection('transaction').doc(txn.id).update({ status, txnHash });

  if (status === 'Success') {
    const gamePlayId = (await getUserGamePlay(userId)).id;
    await firestore
      .collection('gamePlay')
      .doc(gamePlayId)
      .update({ lastTimeSwapXToken: admin.firestore.FieldValue.serverTimestamp() });
  } else {
    await firestore
      .collection('user')
      .doc(userId)
      .update({ xTokenBalance: admin.firestore.FieldValue.increment(amount) });

    throw new Error('API error: Transaction failed');
  }

  return { txnHash, receiveAmount };
};

// utils
export const calculateGeneratedReward = async (userId) => {
  const activeSeasonId = await getActiveSeasonId();

  const gamePlaySnapshot = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', activeSeasonId)
    .limit(1)
    .get();

  const gamePlay = gamePlaySnapshot.docs[0];
  const { startRewardCountingTime, numberOfMachines, machine } = gamePlay.data();

  const now = Date.now();
  const start = startRewardCountingTime.toDate().getTime();
  const diffInDays = (now - start) / (24 * 60 * 60 * 1000);

  const generatedReward = diffInDays * (numberOfMachines * machine.dailyReward);
  return Math.round(generatedReward * 1000) / 1000;
};

const calculateGeneratedXToken = async (userId) => {
  const userSnapshot = await firestore.collection('user').doc(userId).get();
  if (!userSnapshot.exists) return 0;

  const activeSeason = await getActiveSeason();
  const gamePlaySnapshot = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', activeSeason.id)
    .limit(1)
    .get();

  const gamePlay = gamePlaySnapshot.docs[0];
  if (!gamePlay) return 0;

  const { numberOfWorkers, startXTokenCountingTime } = gamePlay.data();
  const { worker } = activeSeason;

  const now = Date.now();
  const start = startXTokenCountingTime.toDate().getTime();
  const diffInDays = (now - start) / (24 * 60 * 60 * 1000);
  const generatedXToken = Math.round(diffInDays * (numberOfWorkers * worker.dailyReward) * 1000) / 1000;

  return generatedXToken;
};
