// worker & building share same formula
export const calculateBuyAmountFromEndPrice = (targetDailyPurchase, targetPrice, startPrice, endPrice) => {
  return Math.ceil(Math.sqrt((endPrice - startPrice) / targetPrice) * targetDailyPurchase);
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
