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

export const calculateReward = (prizePool, rank) => {
  const percentageShares = [
    0.2, // 1st
    0.14, // 2nd
    0.1, // 3rd
    0.07, // 4th
    0.05, // 5th
    0.04, // 6th
    0.03, // 7th
    0.015, // 8th
    0.01, // 9th
    ...Array.from({ length: 6 }, () => 0.0075), // 10th -> 15th
    ...Array.from({ length: 10 }, () => 0.005), // 16th -> 25th
    ...Array.from({ length: 25 }, () => 0.003), // 26th -> 50th
    ...Array.from({ length: 50 }, () => 0.0015), // 51st -> 100th
  ];
  let percentage = percentageShares[rank];

  return prizePool * percentage;
};
