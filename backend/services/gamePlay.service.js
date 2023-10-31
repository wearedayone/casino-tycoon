import { firestore } from '../configs/firebase.config.js';

import { getActiveSeasonId } from './season.service.js';
import { getUserDisplayInfos } from './user.service.js';

export const getLeaderboard = async () => {
  const seasonId = await getActiveSeasonId();

  const snapshot = await firestore
    .collection('gamePlay')
    .where('seasonId', '==', seasonId)
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
    reward: 0,
  }));
};
