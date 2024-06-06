import { getActiveSeason, getActiveSeasonWithRank } from '../utils/utils.js';
import admin, { firestore } from '../configs/admin.config.js';
import alchemy from '../configs/alchemy.config.js';
import environments from '../utils/environments.js';
import { Contract } from '@ethersproject/contracts';
import GangsterArenaABI from '../assets/abis/GameContract.json' assert { type: 'json' };

const { GAME_CONTRACT_ADDRESS } = environments;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const calculateReward = (rankPrizePool, rankingRewards, rankIndex) => {
  // check ranking rewards
  const totalPercentages = rankingRewards.reduce(
    (total, rankingReward) => total + rankingReward.share * (rankingReward.rankEnd - rankingReward.rankStart + 1),
    0
  );
  if (totalPercentages >= 100) throw new Error('API error: Invalid ranking reward');

  const rank = rankIndex + 1;
  const rankingReward = rankingRewards.find((item) => item.rankStart <= rank && rank <= item.rankEnd);
  if (!rankingReward) return 0;

  return rankPrizePool * rankingReward.share;
};

export const getLeaderboard = async (userId) => {
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
  const totalActiveReputation = docs.filter(({ active }) => !!active).reduce((sum, doc) => sum + doc.networth, 0);

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
      reputationReward: doc.active ? (doc.networth / totalActiveReputation) * reputationPrizePool : 0,
    };
  });

  return results;
};

const takeSeasonLeaderboardSnapshot = async () => {
  try {
    // freeze season state

    const { rankPrizePool, reputationPrizePool, id: activeSeasonId } = await getActiveSeason();
    console.log({ rankPrizePool, reputationPrizePool, total: rankPrizePool + reputationPrizePool });
    const seasonRef = firestore.collection('season').doc(activeSeasonId);

    // take leaderboard snapshot
    const leaderboard = await getLeaderboard();
    // console.log(leaderboard[0]);
    for (const user of leaderboard) {
      const { userId, rank, username, rankReward, reputationReward } = user;
      const leaderBoardSnapshot = await firestore
        .collection('leaderBoard')
        .where('userId', '==', userId)
        .where('seasonId', '==', activeSeasonId)
        .limit(1)
        .get();
      console.log({ userId });
      if (leaderBoardSnapshot.empty) {
        await firestore
          .collection('leaderBoard')
          .add({ userId, rank, username, rankReward, reputationReward, seasonId: activeSeasonId, isMigrate: true });
      } else {
        await firestore
          .collection('leaderBoard')
          .doc(leaderBoardSnapshot.docs[0].id)
          .update({ userId, rank, username, rankReward, reputationReward, seasonId: activeSeasonId, isMigrate: true });
      }
    }
  } catch (ex) {
    console.error(ex);
  }
};

const UpdateGamePlay = async () => {
  try {
    const snapshot = await firestore.collection('user').get();
    let i = 0;
    const n = snapshot.docs.length;
    for (let user of snapshot.docs) {
      i++;
      console.log(`search user ${i}/${n}`);
      const g = await firestore
        .collection('gamePlay')
        .where('seasonId', '==', 'X6RRmbbG9kWh7VnqJDC9')
        .where('userId', '==', user.id)
        .get();
      if (g.empty) continue;
      if (g.docs.length > 1) console.log({ ID: user.id });
    }
  } catch (ex) {
    console.error(ex);
  }
};

const UpdateTransaction = async () => {
  try {
    const snapshot = await firestore
      .collection('transaction')
      // .where('type', '==', 'buy-machine')
      .get();
    let i = 0;
    const n = snapshot.docs.length;
    const listHash = [];

    for (let txn of snapshot.docs) {
      i++;
      console.log(`search transaction ${i}/${n}`);
      const userId = txn.data().userId;
      if (userId) {
        const g = await firestore
          .collection('gamePlay')
          .where('userId', '==', userId)
          .where('seasonId', '==', 'X6RRmbbG9kWh7VnqJDC9')
          .get();
        if (g.empty) {
          console.log(txn.id);
          listHash.push(txn.id);
          continue;
        }
      }
    }
    console.log(listHash);
  } catch (ex) {
    console.error(ex);
  }
};

const main = async () => {
  try {
    // await takeSeasonLeaderboardSnapshot();
    // await UpdateGamePlay();
    await UpdateTransaction();
  } catch (err) {
    console.log({ err });
  }
};
main();
