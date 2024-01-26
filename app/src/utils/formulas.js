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

// TODO: update this formula
export const calculateMachineSellPrice = (machinePrice) => {
  return machinePrice * 0.6;
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
    prices.push(calculateNextWorkerBuyPrice(soldCount, targetDailyPurchase, targetPrice, startPrice));
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
