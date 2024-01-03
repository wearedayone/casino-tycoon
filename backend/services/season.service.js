import schedule from 'node-schedule';

import { getAllActiveGamePlay } from './gamePlay.service.js';
import { firestore } from '../configs/firebase.config.js';
import { setGameClosed, setWinner } from './worker.service.js';
import logger from '../utils/logger.js';
import environments from '../utils/environments.js';
import { generateRankingRewards } from '../utils/formulas.js';

const { SYSTEM_ADDRESS } = environments;

export const getActiveSeasonId = async () => {
  const snapshot = await firestore.collection('system').doc('default').get();
  const configs = snapshot.data();

  return configs.activeSeasonId;
};

export const getActiveSeason = async () => {
  const activeSeasonId = await getActiveSeasonId();
  const snapshot = await firestore.collection('season').doc(activeSeasonId).get();
  const { prizePoolConfig, prizePool, ...rest } = snapshot.data();

  const totalPlayers = await getAllActiveGamePlay();
  const rankingRewards = generateRankingRewards({ totalPlayers, prizePool, prizePoolConfig });
  return { id: snapshot.id, ...rest, prizePool, rankingRewards, prizePoolConfig };
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

    // get rewards allocation config
    const { rankingRewards, prizePool } = await getActiveSeason();
    const winnerAllocations = [];
    for (let i = 0; i < rankingRewards.length; i++) {
      const { rankStart, rankEnd, share } = rankingRewards[i];
      const rankRange = rankEnd - rankStart + 1;

      for (let j = 0; j < rankRange; j++) {
        // calculate rewards allocation points
        winnerAllocations.push({ rank: rankStart + j, prizeShare: share, prizeValue: prizePool * share });
      }
    }

    // take leaderboard snapshot
    const gamePlaysSnapshot = await firestore
      .collection('gamePlay')
      .where('seasonId', '==', activeSeasonId)
      .orderBy('networth', 'desc')
      .get();
    const gamePlays = gamePlaysSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    let totalSharePaid = 0;
    for (let i = 0; i < winnerAllocations.length; i++) {
      const player = gamePlays[i];
      // exclude players with 0 networth
      if (player && player.networth > 0) {
        const userSnapshot = await firestore.collection('user').doc(player.userId).get();
        const { address } = userSnapshot.data();
        winnerAllocations[i].address = address;
        winnerAllocations[i].networth = player.networth;
        totalSharePaid += winnerAllocations[i].prizeShare;
      } else break;
    }

    // dev fee is remaining prize pool
    const devFee = 1 - totalSharePaid;
    if (devFee)
      winnerAllocations.push({
        address: SYSTEM_ADDRESS,
        isWorker: true,
        prizeShare: devFee,
        prizeValue: prizePool * devFee,
      });

    // save snapshot to firestore
    // TODO: use event listener to update for accurate prizeValue
    await seasonRef.update({ winnerSnapshot: winnerAllocations });

    // call on-chain `setWinner` method
    const actualWinners = winnerAllocations.filter(({ address }) => !!address);
    const winners = actualWinners.map(({ address }) => address);
    const points = actualWinners.map(({ prizeShare }) => Math.round(prizeShare * Math.pow(10, 6))); // eliminate decimals
    await setWinner({ winners, points });
  } catch (ex) {
    logger.error(ex);
  }
};
