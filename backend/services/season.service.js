import schedule from 'node-schedule';

import { getAllActiveGamePlay, getLeaderboard } from './gamePlay.service.js';
import { firestore } from '../configs/firebase.config.js';
import { setGameClosed, setWinner } from './worker.service.js';
import logger from '../utils/logger.js';
import { generateRankingRewards } from '../utils/formulas.js';

export const getActiveSeasonId = async () => {
  const snapshot = await firestore.collection('system').doc('default').get();
  const configs = snapshot.data();

  return configs.activeSeasonId;
};

export const getActiveSeason = async () => {
  const activeSeasonId = await getActiveSeasonId();
  const snapshot = await firestore.collection('season').doc(activeSeasonId).get();
  const { prizePoolConfig, rankPrizePool, ...rest } = snapshot.data();

  const totalPlayers = await getAllActiveGamePlay();
  const rankingRewards = generateRankingRewards({ totalPlayers, rankPrizePool, prizePoolConfig });
  return { id: snapshot.id, ...rest, rankPrizePool, rankingRewards, prizePoolConfig };
};

const TAKE_SEASON_SNAPSHOT = 'take-season-snapshot';
export const updateSeasonSnapshotSchedule = async () => {
  const existingJob = schedule.scheduledJobs[TAKE_SEASON_SNAPSHOT];
  logger.info(`existingJobExists: ${!!existingJob}`);
  const season = await getActiveSeason();
  const date = season.estimatedEndTime.toDate();

  logger.info(`Scheduling season ${season.id} snapshot at ${date.toLocaleString()}`);
  if (existingJob) existingJob.reschedule(date);
  else schedule.scheduleJob(TAKE_SEASON_SNAPSHOT, date, takeSeasonLeaderboardSnapshot);
};

const takeSeasonLeaderboardSnapshot = async () => {
  try {
    const activeSeasonId = await getActiveSeasonId();
    logger.info(`Taking snapshot for season ${activeSeasonId}`);

    // freeze season state
    const seasonRef = firestore.collection('season').doc(activeSeasonId);
    await seasonRef.update({ status: 'closed' });
    await setGameClosed(true);

    const { rankPrizePool, reputationPrizePool } = await getActiveSeason();

    // take leaderboard snapshot
    const leaderboard = await getLeaderboard();
    const userPromises = leaderboard.map(({ userId }) => firestore.collection('user').doc(userId).get());
    const userAddresses = (await Promise.all(userPromises)).map((doc) => doc.data().address);

    const winnerAllocations = leaderboard
      .filter(({ active, rankReward, reputationReward }) => active && rankReward + reputationReward > 0)
      .map((doc, index) => {
        const { networth, rankReward, reputationReward } = doc;
        const prizeValue = rankReward + reputationReward;
        const prizeShare = prizeValue / (rankPrizePool + reputationPrizePool);
        return {
          rank: index + 1,
          networth,
          prizeValue,
          prizeShare,
          address: userAddresses[index],
          rankReward,
          reputationReward,
        };
      });

    // save snapshot to firestore
    // TODO: use event listener to update for accurate prizeValue
    logger.info(`winnerAllocations: ${JSON.stringify(winnerAllocations)}`);
    await seasonRef.update({ winnerSnapshot: winnerAllocations });

    // call on-chain `setWinner` method
    const winners = winnerAllocations.map(({ address }) => address);
    const points = winnerAllocations.map(({ prizeShare }) => Math.round(prizeShare * Math.pow(10, 6))); // eliminate decimals
    await setWinner({ winners, points });
  } catch (ex) {
    logger.error(ex);
  }
};

export const getWorkerPrices = async () => {
  const activeSeasonId = await getActiveSeasonId();

  const snapshot = await firestore
    .collection('season')
    .doc(activeSeasonId)
    .collection('worker-price')
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getBuildingPrices = async () => {
  const activeSeasonId = await getActiveSeasonId();

  const snapshot = await firestore
    .collection('season')
    .doc(activeSeasonId)
    .collection('building-price')
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
