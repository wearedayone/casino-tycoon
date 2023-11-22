import moment from 'moment';

import { firestore } from '../configs/firebase.config.js';
import { getActiveSeason } from './season.service.js';
import { getUserDisplayInfos } from './user.service.js';
import { calculateReward } from '../utils/formulas.js';

export const getLeaderboard = async (userId) => {
  const season = await getActiveSeason();

  const snapshot = await firestore
    .collection('gamePlay')
    .where('seasonId', '==', season.id)
    .orderBy('networth', 'desc')
    .orderBy('createdAt', 'asc')
    .get();

  const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const userPromises = docs.map((doc) => getUserDisplayInfos(doc.userId));
  const userDatas = await Promise.all(userPromises);

  // implement logic calculate reward
  return docs.map((doc, index) => ({
    ...userDatas[index],
    userId: userDatas[index].id,
    id: doc.id,
    isUser: userDatas[index].id === userId,
    rank: index + 1,
    networth: doc.networth,
    reward: calculateReward(season.prizePool, season.rankingRewards, index),
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
