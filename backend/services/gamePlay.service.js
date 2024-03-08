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
  const random = Math.random();
  console.log('start getLeaderboard: ' + random, Date.now());
  const { id, rankPrizePool, reputationPrizePool, rankingRewards } = await getActiveSeason();

  const snapshot = await firestore
    .collection('gamePlay')
    .where('seasonId', '==', id)
    .orderBy('networth', 'desc')
    .orderBy('createdAt', 'asc')
    .get();

  const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const userPromises = docs.map((doc) => getUserDisplayInfos(doc.userId)).filter(Boolean);
  const userDatas = await Promise.all(userPromises);
  const totalActiveReputation = docs.filter(({ active }) => !!active).reduce((sum, doc) => sum + doc.networth, 0);

  // implement logic calculate reward
  let rank = 0;
  const results = docs.map((doc, index) => {
    if (doc.active) {
      rank++;
    }
    return {
      ...userDatas[index],
      userId: userDatas[index].id,
      id: doc.id,
      isUser: userDatas[index].id === userId,
      rank: doc.active ? rank : '-',
      networth: doc.networth,
      active: doc.active,
      rankReward: doc.active ? calculateReward(rankPrizePool, rankingRewards, rank - 1) : 0,
      reputationReward: doc.active ? (doc.networth / totalActiveReputation) * reputationPrizePool : 0,
    };
  });

  console.log('Finish getLeaderboard: ' + random, Date.now());
  return results;
};

export const getRank = async (userId) => {
  const { id, rankPrizePool, reputationPrizePool, rankingRewards } = await getActiveSeason();
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
    totalActiveReputation += networth;
  }
  let reputationReward = 0;
  if (totalActiveReputation !== 0) {
    reputationReward = (networth / totalActiveReputation) * reputationPrizePool;
  }

  const rank = rankSnapshot.data().count;
  const rankReward = calculateReward(rankPrizePool, rankingRewards, rank - 1);

  // Rank, rank reward, reputationReward totalPlayers

  return { rank, rankReward, reputationReward, totalPlayers };
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
