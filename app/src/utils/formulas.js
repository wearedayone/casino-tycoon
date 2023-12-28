// TODO: update logic calculateMachineSellPrice later
// will get sell price from opensea

export const estimateNumberOfBuildingCanBuy = (buildingSold, balance, basePrice, priceStep) => {
  const x = priceStep;
  const y = basePrice;

  const A = x / 2;
  const B = buildingSold * x + y - (3 * x) / 2;
  const C = x - balance;
  const dental = Math.pow(B, 2) - 4 * A * C;

  const value = Math.floor((Math.sqrt(dental) - B) / (2 * A));
  return value > 0 ? value : 0;
};

export const estimateNumberOfWorkerCanBuy = (workerSold, balance, basePrice, priceStep) => {
  const x = priceStep;
  const y = basePrice;

  const A = x / 2;
  const B = workerSold * x + y - (3 * x) / 2;
  const C = x - balance;
  const dental = Math.pow(B, 2) - 4 * A * C;

  const value = Math.floor((Math.sqrt(dental) - B) / (2 * A));
  return value > 0 ? value : 0;
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
    prices.push(calculateNextWorkerBuyPrice(salesLastPeriod, targetDailyPurchase, targetPrice, startPrice));
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
    prices.push(calculateNextWorkerBuyPrice(salesLastPeriod, targetDailyPurchase, targetPrice, startPrice));
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
