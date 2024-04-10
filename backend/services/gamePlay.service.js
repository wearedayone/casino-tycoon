import moment from 'moment';

import admin, { firestore } from '../configs/firebase.config.js';
import { getActiveSeason, getActiveSeasonId, getActiveSeasonWithRank } from './season.service.js';
import { calculateReward, calculateUpgradeMachinePrice } from '../utils/formulas.js';
import logger from '../utils/logger.js';

const MAX_RETRY = 3;

export const getUserGamePlay = async (userId) => {
  const activeSeasonId = await getActiveSeasonId();
  const gamePlaySnapshot = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', activeSeasonId)
    .limit(1)
    .get();
  if (gamePlaySnapshot.empty) return null;

  const userGamePlay = {
    id: gamePlaySnapshot.docs[0].id,
    ...gamePlaySnapshot.docs[0].data(),
  };

  return userGamePlay;
};

export const getLeaderboard = async (userId) => {
  const random = Math.random();
  const stime = Date.now();
  console.log('start getLeaderboard: ' + userId, random);
  const { id, rankPrizePool, reputationPrizePool, rankingRewards } = await getActiveSeasonWithRank();

  const snapshot = await firestore
    .collection('gamePlay')
    .where('seasonId', '==', id)
    .orderBy('networth', 'desc')
    .orderBy('createdAt', 'asc')
    .get();

  const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  // const userPromises = docs.map((doc) => getUserDisplayInfos(doc.userId)).filter(Boolean);
  // const userDatas = await Promise.all(userPromises);
  const totalSqrtActiveReputation = docs
    .filter(({ active }) => !!active)
    .reduce((sum, doc) => sum + Math.floor(Math.sqrt(doc.networth - 2)), 0);

  // implement logic calculate reward
  let rank = 0;
  const results = docs.map((doc, index) => {
    if (doc.active) {
      rank++;
    }
    return {
      // ...userDatas[index],
      userId: doc.userId,
      id: doc.id,
      isUser: doc.userId === userId,
      rank: doc.active ? rank : '-',
      networth: doc.networth,
      active: doc.active,
      username: doc.username,
      avatarURL: doc.avatarURL,
      avatarURL_small: doc.avatarURL_small,
      rankReward: doc.active ? calculateReward(rankPrizePool, rankingRewards, rank - 1) : 0,
      reputationReward: doc.active
        ? (Math.floor(Math.sqrt(doc.networth - 2)) / totalSqrtActiveReputation) * reputationPrizePool
        : 0,
    };
  });

  console.log('Finish getLeaderboard: ' + userId, random, Date.now() - stime);
  return results;
};

export const getRank = async (userId) => {
  const { id, rankPrizePool, reputationPrizePool, rankingRewards } = await getActiveSeasonWithRank();
  const totalSnapshot = await firestore
    .collection('gamePlay')
    .where('seasonId', '==', id)
    .where('active', '==', true)
    .count()
    .get();
  const totalPlayers = totalSnapshot.data().count;

  const userGamePlay = await firestore
    .collection('gamePlay')
    .where('seasonId', '==', id)
    .where('userId', '==', userId)
    .where('active', '==', true)
    .limit(1)
    .get();
  if (userGamePlay.empty)
    return {
      rank: '-',
      rankReward: 0,
      reputationReward: 0,
      totalPlayers: totalPlayers,
    };
  const { networth } = userGamePlay.docs[0].data();

  const rankSnapshot = await firestore
    .collection('gamePlay')
    .where('seasonId', '==', id)
    .where('networth', '>=', networth)
    .count()
    .get();

  const snapshot = await firestore.collection('gamePlay').where('seasonId', '==', id).where('active', '==', true).get();
  let totalActiveReputation = 0;
  for (let doc of snapshot.docs) {
    const { networth } = doc.data();
    totalActiveReputation += Math.floor(Math.sqrt(networth - 2));
  }
  let reputationReward = 0;
  if (totalActiveReputation !== 0) {
    reputationReward = (Math.floor(Math.sqrt(networth - 2)) / totalActiveReputation) * reputationPrizePool;
  }

  const rank = rankSnapshot.data().count;
  const rankReward = calculateReward(rankPrizePool, rankingRewards, rank - 1);

  // Rank, rank reward, reputationReward totalPlayers

  return { rank, rankReward, reputationReward, totalPlayers };
};

export const getNextWarSnapshotUnixTime = async () => {
  const utcDate = moment().utc().format('DD/MM/YYYY');
  const todaySnapshotTime1 = moment(`${utcDate} 01:00:00`, 'DD/MM/YYYY HH:mm:ss').utc(true).toDate();
  const todaySnapshotTime2 = moment(`${utcDate} 13:00:00`, 'DD/MM/YYYY HH:mm:ss').utc(true).toDate();
  const tmrSnapshotTime1 = moment(`${utcDate} 01:00:00`, 'DD/MM/YYYY HH:mm:ss').utc(true).add(1, 'day').toDate();

  const snapshotTimes = [todaySnapshotTime1.getTime(), todaySnapshotTime2.getTime(), tmrSnapshotTime1.getTime()];
  const now = Date.now();
  const nextTime = snapshotTimes.find((time) => time > now);

  return nextTime;
};

export const updateLastTimeSeenWarResult = async (userId) => {
  const activeSeasonId = await getActiveSeasonId();
  const gamePlaySnapshot = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', activeSeasonId)
    .limit(1)
    .get();
  if (gamePlaySnapshot.empty) throw new Error("API error: Cannot find user's game play");

  await gamePlaySnapshot.docs[0].ref.update({
    lastTimeSeenWarResult: admin.firestore.FieldValue.serverTimestamp(),
  });
};

export const getAllActiveGamePlay = async () => {
  const activeSeasonId = await getActiveSeasonId();
  const snapshot = await firestore
    .collection('gamePlay')
    .where('seasonId', '==', activeSeasonId)
    .where('active', '==', true)
    .count()
    .get();

  return snapshot.data().count;
};

export const updateUserWarDeployment = async ({
  userId,
  numberOfMachinesToEarn,
  numberOfMachinesToAttack,
  numberOfMachinesToDefend,
}) => {
  if (
    [numberOfMachinesToEarn, numberOfMachinesToAttack, numberOfMachinesToDefend].some((num) => num % 1 !== 0 || num < 0)
  )
    throw new Error('API error: Bad request - invalid input');

  const gamePlay = await getUserGamePlay(userId);
  if (!gamePlay) throw new Error('API error: Gameplay doesnt exist');

  const { numberOfMachines } = gamePlay;
  const totalDeployedMachines = numberOfMachinesToEarn + numberOfMachinesToAttack + numberOfMachinesToDefend;
  if (totalDeployedMachines > numberOfMachines) throw new Error('API error: Bad request - invalid number of machines');

  const snapshot = await admin
    .firestore()
    .collection('warDeployment')
    .where('userId', '==', userId)
    .where('seasonId', '==', gamePlay.seasonId)
    .limit(1)
    .get();
  if (snapshot.empty) throw new Error('API error: War deployment doesnt exist');

  const updateData = {
    numberOfMachinesToEarn,
    numberOfMachinesToAttack,
    numberOfMachinesToDefend,
  };

  if (!numberOfMachinesToAttack) {
    updateData.attackUserId = null;
  }

  await snapshot.docs[0].ref.update(updateData);
};

export const updateUserWarAttackUser = async ({ userId, attackUserId }) => {
  if (userId === attackUserId) throw new Error('API error: Bad request - invalid attack user');
  const attackUserSnapshot = await firestore.collection('user').doc(attackUserId).get();
  if (!attackUserSnapshot.exists) throw new Error('API error: Bad request - not found attack user');

  const gamePlay = await getUserGamePlay(userId);
  if (!gamePlay) throw new Error('API error: Gameplay doesnt exist');

  const snapshot = await admin
    .firestore()
    .collection('warDeployment')
    .where('userId', '==', userId)
    .where('seasonId', '==', gamePlay.seasonId)
    .limit(1)
    .get();
  if (snapshot.empty) throw new Error('API error: War deployment doesnt exist');

  await snapshot.docs[0].ref.update({ attackUserId });
};

export const getUserWarDeployment = async (userId) => {
  const seasonId = await getActiveSeasonId();

  const snapshot = await admin
    .firestore()
    .collection('warDeployment')
    .where('userId', '==', userId)
    .where('seasonId', '==', seasonId)
    .limit(1)
    .get();
  if (snapshot.empty) return null;

  return snapshot.docs[0].data();
};

export const calculateGeneratedXToken = async (userId) => {
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

export const upgradeMachine = async (userId) => {
  const season = await getActiveSeason();
  const gamePlay = await getUserGamePlay(userId);
  const upgradePrice = calculateUpgradeMachinePrice(machine.level);

  const user = await firestore.collection('user').doc(userId).get();

  const generatedXToken = calculateGeneratedXToken(userId);
  const xTokenBalance = user.data().xTokenBalance + generatedXToken;
  if (xTokenBalance < upgradePrice) throw new Error('API error: Insufficient xGANG');

  const newLevel = gamePlay.machine.level + 1;
  const xTokenLeft = xTokenBalance - upgradePrice;

  // need to update user, gameplay, create txn
  const batch = firestore.batch();

  // update user
  batch.update(user.ref, { xTokenBalance: xTokenLeft });

  // update gameplay
  const gamePlayRef = firestore.collection('gamePlay').doc(gamePlay.id);
  batch.update(gamePlayRef, {
    startXTokenCountingTime: admin.firestore.FieldValue.serverTimestamp(),
    machine: {
      level: newLevel,
      dailyReward: (1 + newLevel * season.machine.earningRateIncrementPerLevel) * season.machine.dailyReward,
    },
  });

  // create txn
  const txnRef = firestore.collection('transaction').doc();
  batch.create(txnRef, {
    seasonId: season.id,
    userId,
    type: 'upgrade-machine',
    value: upgradePrice,
    token: 'xGANG',
    status: 'Success',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  let retry = 0;
  let isSuccess = false;
  while (retry < MAX_RETRY && !isSuccess) {
    try {
      logger.info(`Upgrading machine for user ${userId}. Retry ${retry++} times`);
      await batch.commit();
      isSuccess = true;
    } catch (err) {
      logger.error(`Unsuccessful upgrading machine for user ${userId}: ${err.message} ${JSON.stringify(err)}`);
    }
  }

  if (!isSuccess) throw new Error('API error: Upgrade machine failed');
};
