import { firestore } from '../configs/firebase.config.js';

import { getActiveSeason } from './season.service.js';
import { getUserDisplayInfos } from './user.service.js';
import { calculateReward } from '../utils/formulas.js';

export const getLeaderboard = async () => {
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
    networth: doc.networth,
    reward: calculateReward(season.prizePool, season.rankingRewards, index),
  }));
};
