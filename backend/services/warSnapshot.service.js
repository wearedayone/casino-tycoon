import admin, { firestore } from '../configs/firebase.config.js';
import logger from '../utils/logger.js';
import { getActiveSeasonId } from './season.service.js';
import {
  calculateGeneratedReward,
  initTransaction,
  userPendingRewardChangedTypes,
  validateNonWeb3Transaction,
  validateTxnHash,
} from './transaction.service.js';
import { claimToken as claimTokenTask, burnNFT as burnNFTTask } from './worker.service.js';

const BONUS_CHANCE = 0.5;
const BONUS_MULTIPLIER = 1;
const PENALTY_CHANCE = 0.1;

export const takeDailyWarSnapshot = async () => {
  logger.info('\n\n---------taking daily war snapshot--------\n');
  const seasonId = await getActiveSeasonId();
  const usersGamePlaySnapshot = await firestore.collection('gamePlay').where('seasonId', '==', seasonId).get();
  const allUsers = usersGamePlaySnapshot.docs.map((gamePlay) => ({ id: gamePlay.id, ...gamePlay.data() }));
  const usersWithWarEnabled = allUsers.filter(({ war }) => !!war);
  const usersWithWarEnabledCount = usersWithWarEnabled.length;

  const voteRatio = usersWithWarEnabledCount / usersGamePlaySnapshot.size;
  const isPenalty = Math.round(voteRatio * 100) / 100 >= BONUS_CHANCE;

  const bonusMap = {};
  const generatedRewardMap = {}; // update when calc bonus
  const penaltyMap = {};
  const createdAt = admin.firestore.FieldValue.serverTimestamp();

  logger.info(
    `${usersWithWarEnabledCount} players voted WAR out of ${usersGamePlaySnapshot.size} players\n voteRatio = ${voteRatio}. isPenalty = ${isPenalty}`
  );

  // reset pending rewards timestamp
  for (let gamePlay of allUsers) {
    generatedRewardMap[gamePlay.userId] = await calculateGeneratedReward(gamePlay.userId);
  }

  const lastWarSnapshot = await firestore.collection('warSnapshot').orderBy('createdAt', 'desc').limit(1).get();
  let lastWarAt;
  if (lastWarSnapshot.size) {
    lastWarAt = lastWarSnapshot.docs[0].data().createdAt.toDate();
  } else {
    lastWarAt = new Date();
    lastWarAt.setDate(lastWarAt.getDate() - 1);
  }

  // calculate bonus & penalty
  for (let gamePlay of usersWithWarEnabled) {
    logger.info(`${gamePlay.userId}`);

    if (isPenalty) {
      const gangster = getDeadCount(gamePlay.numberOfMachines);
      const goon = getDeadCount(gamePlay.numberOfWorkers);
      penaltyMap[gamePlay.userId] = { gangster, goon };

      logger.info(`   penalty.gangster: ${gangster}`);
      logger.info(`   penalty.goon: ${goon}`);
    } else {
      const txnsSinceLastWarSnapshot = await firestore
        .collection('transaction')
        .where('type', 'in', userPendingRewardChangedTypes)
        .where('createdAt', '>=', lastWarAt)
        .orderBy('createdAt', 'desc')
        .get();
      const hasPendingRewardChangedSinceLastWar = txnsSinceLastWarSnapshot.size > 0;

      if (hasPendingRewardChangedSinceLastWar) {
        let pendingRewardSinceLastWar = 0,
          numberOfMachines = gamePlay.numberOfMachines,
          numberOfWorkers = gamePlay.numberOfWorkers,
          start,
          end;

        for (let i = 0; i < txnsSinceLastWarSnapshot.size; i++) {
          const txn = txnsSinceLastWarSnapshot.docs[i].data();
          const isLastTxn = i === txnsSinceLastWarSnapshot.size - 1;

          start = isLastTxn
            ? lastWarAt.getTime()
            : txnsSinceLastWarSnapshot.docs[i + 1].data().createdAt.toDate().getTime();
          start = Math.max(gamePlay.createdAt.toDate().getTime(), start); // if user joined after last war
          end = txn.createdAt.toDate().getTime();
          if (txn.type === 'buy-machine') numberOfMachines -= txn.amount;
          if (txn.type === 'buy-worker') numberOfWorkers -= txn.amount;
          if (txn.type === 'war-penalty') {
            numberOfMachines += txn.machinesDeadCount;
            numberOfWorkers += txn.workersDeadCount;
          }
          const generatedReward = await calculateGeneratedReward(gamePlay.userId, {
            start,
            end,
            numberOfMachines,
            numberOfWorkers,
          });

          pendingRewardSinceLastWar += generatedReward;
        }
        const bonusAmount = (pendingRewardSinceLastWar + generatedRewardMap[gamePlay.userId]) * BONUS_MULTIPLIER;
        bonusMap[gamePlay.userId] = bonusAmount;
        logger.debug(`   pendingRewardSinceLastWar: ${pendingRewardSinceLastWar}`);
        logger.debug(`   generatedReward: ${generatedRewardMap[gamePlay.userId]}`);
        logger.info(`   bonusAmount: ${bonusAmount}\n`);
      } else {
        const bonusAmount = generatedRewardMap[gamePlay.userId] * BONUS_MULTIPLIER;
        bonusMap[gamePlay.userId] = bonusAmount;
        logger.debug(`   generatedReward: ${generatedRewardMap[gamePlay.userId]}`);
        logger.info(`   bonusAmount: ${bonusAmount}\n`);
      }
    }
  }

  // log war snapshot
  const todayDateString = new Date().toISOString().substring(0, 10).split('-').join(''); // YYYYMMDD format
  await firestore.collection('warSnapshot').doc(todayDateString).set({
    seasonId,
    usersCount: usersGamePlaySnapshot.size,
    usersWithWarEnabledCount,
    voteRatio,
    createdAt,
    bonus: bonusMap,
    penalty: penaltyMap,
  });

  // log user war result
  for (let gamePlay of allUsers) {
    const bonus = bonusMap[gamePlay.userId] ?? null;
    const penalty = penaltyMap[gamePlay.userId] ?? null;
    try {
      await firestore.collection('warSnapshot').doc(todayDateString).collection('warResult').add({
        seasonId,
        isWarEnabled: !!gamePlay.war,
        voteRatio,
        bonus,
        penalty,
        createdAt,
        userId: gamePlay.userId,
      });

      // send user war bonus
      if (bonus) {
        const txn = await initTransaction({
          userId: gamePlay.userId,
          type: 'war-bonus',
          value: bonus,
        });

        const userSnapshot = await firestore.collection('user').doc(gamePlay.userId).get();
        const { address } = userSnapshot.data();
        const { txnHash, status } = await claimTokenTask({
          address,
          amount: BigInt(bonus * 1e18),
        });

        await firestore.collection('transaction').doc(txn.id).update({
          txnHash,
          status,
        });
      }

      // burn user assets as penalty
      if (penalty?.gangster || penalty?.goon) {
        const txn = await initTransaction({
          userId: gamePlay.userId,
          type: 'war-penalty',
          machinesDeadCount: penalty.gangster,
          workersDeadCount: penalty.goon,
        });

        // need onchain action
        if (penalty.gangster) {
          const userSnapshot = await firestore.collection('user').doc(gamePlay.userId).get();
          const { address } = userSnapshot.data();

          const { txnHash } = await burnNFTTask({ address, amount: penalty.gangster });

          await validateTxnHash({
            userId: gamePlay.userId,
            transactionId: txn.id,
            txnHash,
          });
        } else {
          await validateNonWeb3Transaction({ userId: gamePlay.userId, transactionId: txn.id });
        }
      }

      await firestore
        .collection('gamePlay')
        .doc(gamePlay.id)
        .update({
          pendingReward: admin.firestore.FieldValue.increment(generatedRewardMap[gamePlay.userId]),
          startRewardCountingTime: createdAt,
        });
    } catch (error) {
      console.error(error);
      logger.error(`err while writing war result for ${gamePlay.userId}: ${error.message}`);
    }
  }

  logger.info('\n---------finish taking daily war snapshot--------\n\n');
};

export const getWarHistory = async (userId) => {
  const seasonId = await getActiveSeasonId();

  const warHistorySnapshot = await firestore
    .collection('user')
    .doc(userId)
    .collection('warHistory')
    .where('seasonId', '==', seasonId)
    .orderBy('createdAt', 'desc')
    .get();

  const warHistory = warHistorySnapshot.docs.map((doc) => {
    const { bonus, penalty, createdAt, ...rest } = doc.data();
    let outcome = null;

    if (bonus) outcome = `+${bonus} $FIAT`;
    else if (penalty) {
      const strings = [];
      if (penalty.gangster) strings.push(`-${penalty.gangster} gangster${penalty.gangster > 1 ? 's' : ''}`);
      if (penalty.goon) strings.push(`-${penalty.goon} goon${penalty.goon > 1 ? 's' : ''}`);
      outcome = penalty.gangster || penalty.goon ? strings.join(', ') : null;
    }
    return { id: doc.id, outcome, createdAt: createdAt.toDate(), ...rest };
  });
  return warHistory;
};

// utils
const getDeadCount = (originalCount) => {
  // example: originalCount = 86, PENALTY_CHANCE = 0.1;
  // deadCount = 8.6;
  const deadCount = originalCount * PENALTY_CHANCE;
  // certainDeathCount = 8 => 8 units certainly will die
  const certainDeathCount = Math.floor(deadCount);

  // chanceOfExtraDeath = 0.6 => 1 unit has 60% of dying
  const chanceOfExtraDeath = deadCount - certainDeathCount;
  const extraDeath = Math.random() < chanceOfExtraDeath ? 1 : 0;
  logger.info(`originalCount: ${originalCount}`);
  logger.info(`deadCount: ${certainDeathCount + extraDeath}`);

  return certainDeathCount + extraDeath;
};
