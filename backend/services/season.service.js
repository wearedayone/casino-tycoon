import schedule from 'node-schedule';
import chunk from 'lodash.chunk';

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

  return { id: snapshot.id, ...snapshot.data() };
};

export const getActiveSeasonWithRank = async () => {
  const activeSeasonId = await getActiveSeasonId();
  const snapshot = await firestore.collection('season').doc(activeSeasonId).get();
  const { prizePoolConfig, rankPrizePool, ...rest } = snapshot.data();

  const totalPlayers = await getAllActiveGamePlay();
  const rankingRewards = generateRankingRewards({ totalPlayers, rankPrizePool, prizePoolConfig });
  return { id: snapshot.id, ...rest, rankPrizePool, rankingRewards, prizePoolConfig };
};

export const takeSeasonLeaderboardSnapshot = async () => {
  try {
    const activeSeason = await getActiveSeason();
    if (activeSeason.status !== 'open') return;

    logger.info(`Taking snapshot for season ${activeSeason.id}`);

    // freeze season state
    const seasonRef = firestore.collection('season').doc(activeSeason.id);

    const { rankPrizePool, reputationPrizePool } = activeSeason;

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

    const winners = winnerAllocations.map(({ address }) => address);
    const points = winnerAllocations.map(({ prizeShare }) => Math.round(prizeShare * Math.pow(10, 6))); // eliminate decimals
    const totalPoints = points.reduce((sum, point) => sum + point, 0);
    // save snapshot to firestore
    // TODO: use event listener to update for accurate prizeValue
    logger.info(`winnerAllocations: ${JSON.stringify(winnerAllocations)}`);
    await seasonRef.update({ status: 'closed', winnerSnapshot: winnerAllocations });
    await setGameClosed(true, totalPoints);

    // call on-chain `setWinner` method
    // chunk to set winner, max 20 users per time
    const maxPerTime = 20;
    const chunkedWinners = chunk(winners, maxPerTime);
    const chunkedPoints = chunk(points, maxPerTime);

    for (const i in chunkedWinners) {
      const winnerArray = chunkedWinners[i];
      const pointArray = chunkedPoints[i];
      await setWinner({ winners: winnerArray, points: pointArray });
    }
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
