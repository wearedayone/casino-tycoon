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
