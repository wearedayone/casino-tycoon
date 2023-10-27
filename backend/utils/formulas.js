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

export const calculateReversePoolBonus = (reversePool) => {
  return reversePool * 0.1;
};
