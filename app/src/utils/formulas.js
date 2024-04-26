// TODO: update logic calculateMachineSellPrice later
// will get sell price from opensea

export const estimateNumberOfBuildingCanBuy = (
  balance,
  salesLastPeriod,
  targetDailyPurchase,
  targetPrice,
  startPrice,
  maxPerBatch
) => {
  let quantity = 0;
  let total = calculateNextBuildingBuyPriceBatch(
    salesLastPeriod,
    targetDailyPurchase,
    targetPrice,
    startPrice,
    quantity
  ).total;
  let nextTotal = calculateNextBuildingBuyPriceBatch(
    salesLastPeriod,
    targetDailyPurchase,
    targetPrice,
    startPrice,
    quantity + 1
  ).total;
  while (quantity < maxPerBatch && nextTotal <= balance) {
    quantity++;
    total = calculateNextBuildingBuyPriceBatch(
      salesLastPeriod,
      targetDailyPurchase,
      targetPrice,
      startPrice,
      quantity
    ).total;
    nextTotal = calculateNextBuildingBuyPriceBatch(
      salesLastPeriod,
      targetDailyPurchase,
      targetPrice,
      startPrice,
      quantity + 1
    ).total;
  }

  return quantity;
};

export const estimateNumberOfWorkerCanBuy = (
  balance,
  salesLastPeriod,
  targetDailyPurchase,
  targetPrice,
  startPrice,
  maxPerBatch
) => {
  let quantity = 0;
  let total = calculateNextWorkerBuyPriceBatch(
    salesLastPeriod,
    targetDailyPurchase,
    targetPrice,
    startPrice,
    quantity
  ).total;
  let nextTotal = calculateNextWorkerBuyPriceBatch(
    salesLastPeriod,
    targetDailyPurchase,
    targetPrice,
    startPrice,
    quantity + 1
  ).total;
  while (quantity < maxPerBatch && nextTotal <= balance) {
    quantity++;
    total = calculateNextWorkerBuyPriceBatch(
      salesLastPeriod,
      targetDailyPurchase,
      targetPrice,
      startPrice,
      quantity
    ).total;
    nextTotal = calculateNextWorkerBuyPriceBatch(
      salesLastPeriod,
      targetDailyPurchase,
      targetPrice,
      startPrice,
      quantity + 1
    ).total;
  }

  return quantity;
};

export const estimateNumberOfMachineCanBuy = (
  balance,
  salesLastPeriod,
  targetDailyPurchase,
  targetPrice,
  startPrice,
  maxPerBatch
) => {
  let quantity = 0;
  let total = calculateNextMachineBuyPriceBatch(
    salesLastPeriod,
    targetDailyPurchase,
    targetPrice,
    startPrice,
    quantity
  ).total;
  let nextTotal = calculateNextMachineBuyPriceBatch(
    salesLastPeriod,
    targetDailyPurchase,
    targetPrice,
    startPrice,
    quantity + 1
  ).total;
  console.log('estimatee', { total, nextTotal, maxPerBatch, balance });
  while (quantity < maxPerBatch && nextTotal <= balance) {
    quantity++;
    total = calculateNextMachineBuyPriceBatch(
      salesLastPeriod,
      targetDailyPurchase,
      targetPrice,
      startPrice,
      quantity
    ).total;
    nextTotal = calculateNextMachineBuyPriceBatch(
      salesLastPeriod,
      targetDailyPurchase,
      targetPrice,
      startPrice,
      quantity + 1
    ).total;
  }

  return quantity;
};

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
    prices.push(calculateNextBuildingBuyPrice(soldCount, targetDailyPurchase, targetPrice, startPrice));
    soldCount++;
  }

  return {
    total: prices.reduce((total, item) => total + item, 0),
    prices,
  };
};

export const calculateNextMachineBuyPrice = (salesLastPeriod, targetDailyPurchase, targetPrice, startPrice) => {
  return Math.pow(salesLastPeriod / targetDailyPurchase, 2) * targetPrice + startPrice;
};

export const calculateNextMachineBuyPriceBatch = (
  salesLastPeriod,
  targetDailyPurchase,
  targetPrice,
  startPrice,
  quantity
) => {
  let soldCount = salesLastPeriod;
  const prices = [];
  while (soldCount < salesLastPeriod + quantity) {
    prices.push(calculateNextMachineBuyPrice(soldCount, targetDailyPurchase, targetPrice, startPrice));
    soldCount++;
  }

  return {
    total: prices.reduce((total, item) => total + item, 0),
    prices,
  };
};

export const calculateHouseLevel = (houseLevels, networth) => {
  const levelItem = houseLevels.find((item) => {
    let valid = networth >= item.networthStart;
    if (!valid) return false;

    if (item.networthEnd) {
      valid = networth <= item.networthEnd;
    }

    return valid;
  });

  return levelItem?.level;
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

export const getReputationWhenWinWar = (attackerNetworth, defenderNetworth) => {
  let gainedReputation = 5;
  const reputationRatio = defenderNetworth / attackerNetworth;

  if (reputationRatio > 10) gainedReputation = 50;
  else if (reputationRatio > 5) gainedReputation = 40;
  else if (reputationRatio > 3) gainedReputation = 30;
  else if (reputationRatio > 2) gainedReputation = 20;
  else if (reputationRatio > 1) gainedReputation = 10;

  return gainedReputation;
};
