export const calculateNextWorkerBuyPrice = (workerSold, basePrice, priceStep) => {
  return workerSold * priceStep + basePrice;
};

export const calculateNextWorkerBuyPriceBatch = (workerSold, quantity, basePrice, priceStep) => {
  let soldCount = workerSold;
  const prices = [];
  while (soldCount < workerSold + quantity) {
    prices.push(calculateNextWorkerBuyPrice(soldCount, basePrice, priceStep));
    soldCount++;
  }

  return {
    total: prices.reduce((total, item) => total + item, 0),
    prices,
  };
};

export const calculateNextBuildingBuyPrice = (buildingSold, basePrice, priceStep) => {
  return buildingSold * priceStep + basePrice;
};

export const calculateNextBuildingBuyPriceBatch = (buildingSold, quantity, basePrice, priceStep) => {
  let soldCount = buildingSold;
  const prices = [];
  while (soldCount < buildingSold + quantity) {
    prices.push(calculateNextBuildingBuyPrice(soldCount, basePrice, priceStep));
    soldCount++;
  }

  return {
    total: prices.reduce((total, item) => total + item, 0),
    prices,
  };
};

export const calculateNewEstimatedEndTimeUnix = (currentEndTimeUnix, newMachineAddedQuantity, timeStepInHours) => {
  return currentEndTimeUnix + newMachineAddedQuantity * timeStepInHours * 60 * 60 * 1000;
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

export const generateCode = (length) => {
  const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let retVal = '';
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n)).toLowerCase();
  }
  return retVal;
};
