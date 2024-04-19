export const calculateNextWorkerBuyPrice = (salesLastPeriod, targetDailyPurchase, targetPrice, startPrice) => {
  return Math.pow(salesLastPeriod / targetDailyPurchase, 2) * targetPrice + startPrice;
};

export const calculateNextWorkerBuyPriceBatch = (
  salesLastPeriod,
  targetDailyPurchase,
  targetPrice,
  startPrice,
  quantity
) => {
  let soldCount = salesLastPeriod;
  const prices = [];
  while (soldCount < salesLastPeriod + quantity) {
    prices.push(calculateNextWorkerBuyPrice(soldCount, targetDailyPurchase, targetPrice, startPrice));
    soldCount++;
  }

  return {
    total: prices.reduce((total, item) => total + item, 0),
    prices,
  };
};

export const calculateNextBuildingBuyPrice = (salesLastPeriod, targetDailyPurchase, targetPrice, startPrice) => {
  return Math.pow(salesLastPeriod / targetDailyPurchase, 2) * targetPrice + startPrice;
};

export const calculateNextBuildingBuyPriceBatch = (
  salesLastPeriod,
  targetDailyPurchase,
  targetPrice,
  startPrice,
  quantity
) => {
  let soldCount = salesLastPeriod;
  const prices = [];
  while (soldCount < salesLastPeriod + quantity) {
    prices.push(calculateNextWorkerBuyPrice(soldCount, targetDailyPurchase, targetPrice, startPrice));
    soldCount++;
  }

  return {
    total: prices.reduce((total, item) => total + item, 0),
    prices,
  };
};

export const calculateNewEstimatedEndTimeUnix = (currentEndTimeUnix, amount, timeIncrementInSeconds) => {
  return currentEndTimeUnix + amount * timeIncrementInSeconds * 1000;
};

export const calculateReservePoolBonus = (reservePool, reservePoolReward, quantity) => {
  let totalPercentages = 100;
  let percentage = 0;

  for (let i = 1; i <= quantity; i++) {
    percentage += totalPercentages * reservePoolReward;
    totalPercentages -= percentage;
  }

  return (reservePool * percentage) / 100;
};

export const calculateReward = (rankPrizePool, rankingRewards, rankIndex) => {
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

export const generateCode = (length) => {
  const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let retVal = '';
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n)).toLowerCase();
  }
  return retVal;
};

export const calculateSpinPrice = (networth) => {
  return networth * 5 + 500;
};

export const getTokenFromXToken = (xToken) => {
  return xToken;
};

export const calculateUpgradeMachinePrice = (currentLevel) => {
  const nextLevel = currentLevel + 1;
  return Math.pow(nextLevel, 1.5) * 1000;
};

export const calculateUpgradeBuildingPrice = (currentLevel) => {
  const nextLevel = currentLevel + 1;
  return Math.pow(nextLevel, 1.5) * 1000;
};
