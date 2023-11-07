export const calculateNextWorkerBuyPrice = (workerSold) => {
  const x = 100;
  const y = 2000;

  return workerSold * x + y;
};

export const calculateNextWorkerBuyPriceBatch = (workerSold, quantity) => {
  let soldCount = workerSold;
  const prices = [];
  while (soldCount < workerSold + quantity) {
    prices.push(calculateNextWorkerBuyPrice(soldCount));
    soldCount++;
  }

  return {
    total: prices.reduce((total, item) => total + item, 0),
    prices,
  };
};

export const calculateNextBuildingBuyPrice = (buildingSold) => {
  const x = 100;
  const y = 2000;

  return buildingSold * x + y;
};

export const calculateNextBuildingBuyPriceBatch = (buildingSold, quantity) => {
  let soldCount = buildingSold;
  const prices = [];
  while (soldCount < buildingSold + quantity) {
    prices.push(calculateNextBuildingBuyPrice(soldCount));
    soldCount++;
  }

  return {
    total: prices.reduce((total, item) => total + item, 0),
    prices,
  };
};

export const calculateNewEstimatedEndTimeUnix = (currentEndTimeUnix, newMachineAddedQuantity) => {
  return currentEndTimeUnix + newMachineAddedQuantity * 60 * 60 * 1000;
};

export const calculateReversePoolBonus = (reversePool, quantity) => {
  let totalPercentages = 100;
  let percentage = 0;

  for (let i = 1; i <= quantity; i++) {
    percentage += totalPercentages * 0.01;
    totalPercentages -= percentage;
  }

  return (reversePool * percentage) / 100;
};

export const calculateReward = (prizePool, rankingRewards, rankIndex) => {
  // check ranking rewards
  const totalPercentages = rankingRewards.reduce(
    (total, rankingReward) => total + rankingReward.share * (rankingReward.rankEnd - rankingReward.rankStart + 1),
    0
  );
  if (totalPercentages >= 100) throw new Error('Invalid ranking reward');

  const rank = rankIndex + 1;
  const rankingReward = rankingRewards.find((item) => item.rankStart <= rank && rank <= item.rankEnd);
  if (!rankingReward) return 0;

  return prizePool * rankingReward.share;
};
