export const calculateMachineSellPrice = (machineSold) => {
  const x = 1.5;
  const y = 10000;
  const z = 0.05;

  const sellPrice = machineSold ** x / y + z;
  return Math.round(sellPrice * 1000) / 1000;
};

export const calculateWorkerBuyPrice = (workerSold) => {
  const x = 100;
  const y = 2000;

  return workerSold * x + y;
};

export const calculateBuildingBuyPrice = (buildingSold) => {
  const x = 100;
  const y = 2000;

  return buildingSold * x + y;
};
