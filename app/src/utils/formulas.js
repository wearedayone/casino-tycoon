// TODO: update logic calculateMachineSellPrice later
// will get sell price from opensea

export const estimateNumberOfBuildingCanBuy = (buildingSold, balance) => {
  const x = 100;
  const y = 2000;

  const A = x / 2;
  const B = buildingSold * x + y - (3 * x) / 2;
  const C = x - balance;
  const dental = Math.pow(B, 2) - 4 * A * C;

  const value = Math.floor((Math.sqrt(dental) - B) / (2 * A));
  return value > 0 ? value : 0;
};

export const estimateNumberOfWorkerCanBuy = (workerSold, balance) => {
  const x = 100;
  const y = 2000;

  const A = x / 2;
  const B = workerSold * x + y - (3 * x) / 2;
  const C = x - balance;
  const dental = Math.pow(B, 2) - 4 * A * C;

  const value = Math.floor((Math.sqrt(dental) - B) / (2 * A));
  return value > 0 ? value : 0;
};

export const calculateMachineSellPrice = (machinePrice) => {
  return machinePrice * 0.6;
};

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
