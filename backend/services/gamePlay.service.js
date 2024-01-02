import moment from 'moment';

import admin, { firestore } from '../configs/firebase.config.js';
import { getActiveSeason, getActiveSeasonId } from './season.service.js';
import { getUserDisplayInfos } from './user.service.js';
import { calculateReward } from '../utils/formulas.js';

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

export const updateUserWarDeployment = async ({
  userId,
  numberOfMachinesToEarn,
  numberOfMachinesToAttack,
  numberOfMachinesToDefend,
}) => {
  if (
    [numberOfMachinesToEarn, numberOfMachinesToAttack, numberOfMachinesToDefend].some((num) => num % 1 !== 0 || num < 0)
  )
    throw new Error('Bad request: invalid input');

  const gamePlay = await getUserGamePlay(userId);
  if (!gamePlay) throw new Error('Gameplay doesnt exist');

  const totalMachinesForWar = numberOfMachinesToEarn + numberOfMachinesToAttack + numberOfMachinesToDefend;
  const { numberOfMachines } = gamePlay;
  if (numberOfMachines !== totalMachinesForWar)
    throw new Error('Bad request: total machines need to be used for war deployment');

  await firestore
    .collection('gamePlay')
    .doc(gamePlay.id)
    .update({
      warDeployment: {
        ...(gamePlay.warDeployment || {}),
        numberOfMachinesToEarn,
        numberOfMachinesToAttack,
        numberOfMachinesToDefend,
      },
    });
};

export const updateUserWarAttackUser = async ({ userId, attackUserId }) => {
  if (userId === attackUserId) throw new Error('Bad request: invalid attack user');
  const attackUserSnapshot = await firestore.collection('user').doc(attackUserId).get();
  if (!attackUserSnapshot.exists) throw new Error('Bad request: not found attack user');

  const gamePlay = await getUserGamePlay(userId);
  if (!gamePlay) throw new Error('Gameplay doesnt exist');

  await firestore
    .collection('gamePlay')
    .doc(gamePlay.id)
    .update({ warDeployment: { ...(gamePlay.warDeployment || {}), attackUserId } });
};
