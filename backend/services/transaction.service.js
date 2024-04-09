import { formatEther, parseEther } from '@ethersproject/units';
import moment from 'moment';

import admin, { firestore } from '../configs/firebase.config.js';
import quickNode from '../configs/quicknode.config.js';
import { getActiveSeason } from './season.service.js';
import { getLeaderboard } from './gamePlay.service.js';
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
  calculateNewEstimatedEndTimeUnix,
  calculateSpinPrice,
} from '../utils/formulas.js';
import { getAccurate } from '../utils/math.js';
import logger from '../utils/logger.js';
import environments from '../utils/environments.js';

const { SYSTEM_ADDRESS } = environments;

export const initTransaction = async ({ userId, type, ...data }) => {
  logger.info(`init transaction user:${userId} - type:${type}`);
  const activeSeason = await getActiveSeason();

  const utcDate = moment().utc().format('DD/MM/YYYY');
  const todayStartTime = moment(`${utcDate} 00:00:00`, 'DD/MM/YYYY HH:mm:ss').utc(true).toDate().getTime();

  if (type === 'buy-machine') {
    if (data.amount > activeSeason.machine.maxPerBatch) throw new Error('API error: Bad request - over max per batch');
  }

  if (type === 'buy-worker') {
    if (!['xGANG', 'FIAT'].includes(data.token)) throw new Error('API error: Bad request - invalid token');
    if (data.amount > activeSeason.worker.maxPerBatch) throw new Error('API error: Bad request - over max per batch');
  }

  if (type === 'buy-building') {
    if (!['xGANG', 'FIAT'].includes(data.token)) throw new Error('API error: Bad request - invalid token');
    if (data.amount > activeSeason.building.maxPerBatch) throw new Error('API error: Bad request - over max per batch');
  }
  let userSnapshot,
    currentXTokenBalance = 0;
  if (['buy-machine', 'buy-building', 'buy-worker'].includes(type)) {
    userSnapshot = await firestore.collection('user').doc(userId).get();

    if (['buy-building', 'buy-worker'].includes(type) && data.token === 'xGANG') {
      const generatedXToken = await calculateGeneratedXToken(userId);
      currentXTokenBalance = userSnapshot.data().xTokenBalance + generatedXToken;
    }
  }

  if (type === 'daily-spin') {
    const utcDate = moment().utc().format('DD/MM/YYYY');
    const todayStartTime = moment(`${utcDate} 00:00:00`, 'DD/MM/YYYY HH:mm:ss').utc(true).toDate().getTime();
    const existedSnapshot = await firestore
      .collection('transaction')
      .where('seasonId', '==', activeSeason.id)
      .where('userId', '==', userId)
      .where('type', '==', 'daily-spin')
      .where('status', 'in', ['Pending', 'Success'])
      .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(todayStartTime))
      .get();
    if (!existedSnapshot.empty) throw new Error('API error: Already spin today');
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
      const estimatedPrice = data.amount * unitPrice;
      txnData.value = getAccurate(estimatedPrice);
      txnData.prices = Array.from({ length: data.amount }, () => unitPrice);
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

      if (data.token === 'xGANG' && currentXTokenBalance < txnData.value)
        throw new Error('API error: Not enough xGANG for purchase');
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

      if (data.token === 'xGANG' && currentXTokenBalance < txnData.value)
        throw new Error('API error: Not enough xGANG for purchase');
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
      const basePrice = await convertEthInputToToken(txnData.prices[0]);
      const value = parseEther((basePrice.amount * txnData.amount).toString()).toBigInt();
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
        value,
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

const updateUserBalance = async (userId, transactionId) => {
  const userSnapshot = await firestore.collection('user').doc(userId).get();
  const snapshot = await firestore.collection('transaction').doc(transactionId).get();
  const { token, seasonId, value: txnValue } = snapshot.data();

  if (userSnapshot.exists) {
    const { address, ETHBalance } = userSnapshot.data();
    if (token === 'ETH') {
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
    if (token === 'xGANG') {
      const gamePlay = await firestore
        .collection('gamePlay')
        .where('userId', '==', userId)
        .where('seasonId', '==', seasonId)
        .limit(1)
        .get();
      if (!gamePlay.empty) {
        const now = Date.now();
        const generatedXToken = await calculateGeneratedXToken(userId);
        await firestore
          .collection('gamePlay')
          .doc(gamePlay.docs[0].id)
          .update({
            startXTokenCountingTime: admin.firestore.Timestamp.fromMillis(now),
          });

        const balanceDiff = generatedXToken - txnValue;
        await firestore
          .collection('user')
          .doc(userId)
          .update({ xTokenBalance: admin.firestore.FieldValue.increment(balanceDiff) });
      }
    }
  }
};

const updateUserGamePlay = async (userId, transactionId) => {
  const snapshot = await firestore.collection('transaction').doc(transactionId).get();
  const { type } = snapshot.data();

  const activeSeason = await getActiveSeason();

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
    case 'war-bonus':
      const { gainedReputation } = snapshot.data();
      gamePlayData = {
        networth: admin.firestore.FieldValue.increment(gainedReputation),
        networthFromWar: admin.firestore.FieldValue.increment(gainedReputation),
      };
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

// utils
export const calculateGeneratedReward = async (userId) => {
  const activeSeason = await getActiveSeason();
  // if (activeSeason.status !== 'open') throw new Error('Season ended');

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

/* all txn types that change user's token generation rate */
const userTokenGenerationRateChangedTypes = ['war-penalty'];
export const userPendingRewardChangedTypes = userTokenGenerationRateChangedTypes.concat('claim-token');
