import moment from 'moment';

import admin, { firestore } from '../configs/firebase.config.js';
import { getActiveSeason, getActiveSeasonId } from './season.service.js';
import { getUserDisplayInfos } from './user.service.js';
import { calculateReward } from '../utils/formulas.js';

export const getLeaderboard = async (userId) => {
  const { id, prizePool, prizePoolConfig, rankingRewards } = await getActiveSeason();

  const snapshot = await firestore
    .collection('gamePlay')
    .where('seasonId', '==', id)
    .orderBy('networth', 'desc')
    .orderBy('createdAt', 'asc')
    .get();

  const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const userPromises = docs.map((doc) => getUserDisplayInfos(doc.userId)).filter(Boolean);
  const userDatas = await Promise.all(userPromises);
  const totalReputation = docs.reduce((sum, doc) => sum + doc.networth, 0);
  const reputationPrizePool = prizePoolConfig.allocation.reputationRewardsPercent * prizePool;

  // implement logic calculate reward
  return docs.map((doc, index) => ({
    ...userDatas[index],
    userId: userDatas[index].id,
    id: doc.id,
    isUser: userDatas[index].id === userId,
    rank: index + 1,
    networth: doc.networth,
    reward: calculateReward(prizePool, rankingRewards, index),
    reputationReward: (doc.networth / totalReputation) * reputationPrizePool,
  }));
};

export const getNextWarSnapshotUnixTime = async () => {
  const dayNow = moment().format('DD/MM/YYYY');
  const warSnapshotToday = moment(`${dayNow} 01:00:00`, 'DD/MM/YYYY HH:mm:ss'); // TODO: update war snapshot time

  const isDoneToday = moment().isAfter(warSnapshotToday);
  if (!isDoneToday) return warSnapshotToday.toDate().getTime();

  const nextWarSnapshot = warSnapshotToday.add(1, 'day');
  return nextWarSnapshot.toDate().getTime();
};

export const updateLastTimeSeenWarResult = async (userId) => {
  const activeSeasonId = await getActiveSeasonId();
  const gamePlaySnapshot = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', activeSeasonId)
    .limit(1)
    .get();
  if (gamePlaySnapshot.empty) throw new Error("Cannot find user's game play");

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
    .get();

  return snapshot.size;
};
