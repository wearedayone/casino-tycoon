import { firestore } from '../configs/admin.config.js';

export const getActiveSeasonId = async () => {
  const snapshot = await firestore.collection('system').doc('default').get();
  const configs = snapshot.data();

  return configs.activeSeasonId;
};

// export const getActiveSeason = async () => {
//   const activeSeasonId = await getActiveSeasonId();
//   const snapshot = await firestore.collection('season').doc(activeSeasonId).get();

//   return { id: snapshot.id, ...snapshot.data() };
// };

export const getActiveSeason = async () => {
  const activeSeasonId = await getActiveSeasonId();
  const snapshot = await firestore.collection('season').doc(activeSeasonId).get();
  const { prizePoolConfig, rankPrizePool, ...rest } = snapshot.data();

  const totalPlayers = await getAllActiveGamePlay();
  const rankingRewards = generateRankingRewards({ totalPlayers, rankPrizePool, prizePoolConfig });
  return { id: snapshot.id, ...rest, rankPrizePool, rankingRewards, prizePoolConfig };
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

export const generateRankingRewards = ({ totalPlayers, rankPrizePool, prizePoolConfig }) => {
  const {
    rewardScalingRatio,
    higherRanksCutoffPercent,
    lowerRanksCutoffPercent,
    minRewardHigherRanks,
    minRewardLowerRanks,
  } = prizePoolConfig;
  const totalPaidPlayersCount = Math.round(lowerRanksCutoffPercent * totalPlayers);
  const higherRanksPlayersCount = Math.round(higherRanksCutoffPercent * totalPlayers);
  const lowerRanksPlayersCount = totalPaidPlayersCount - higherRanksPlayersCount;
  const minRewardPercentHigherRanks = minRewardHigherRanks / rankPrizePool;
  const minRewardPercentLowerRanks = minRewardLowerRanks / rankPrizePool;

  const remainingRankPoolPercent =
    1 - (minRewardPercentHigherRanks * higherRanksPlayersCount + minRewardPercentLowerRanks * lowerRanksPlayersCount);

  let totalExtraRewardWeight = 0;
  let rankingRewards = [];
  for (let rank = 1; rank <= totalPaidPlayersCount; rank++) {
    const extraRewardWeight = Math.pow(rewardScalingRatio, totalPaidPlayersCount - rank);
    totalExtraRewardWeight += extraRewardWeight;

    rankingRewards.push({ rankStart: rank, rankEnd: rank, extraRewardWeight });
  }

  for (let player of rankingRewards) {
    const minRewardPercent =
      player.rankStart <= higherRanksPlayersCount ? minRewardPercentHigherRanks : minRewardPercentLowerRanks;
    const extraRewardPercent = (player.extraRewardWeight / totalExtraRewardWeight) * remainingRankPoolPercent;

    player.share = minRewardPercent + extraRewardPercent;
    player.prizeValue = rankPrizePool * player.share;
    delete player.extraRewardWeight;
  }

  // console.log('rankingRewards', rankingRewards);

  return rankingRewards;
};
