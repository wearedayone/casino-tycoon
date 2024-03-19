import fs from 'fs';

import admin, { firestore } from '../configs/admin.config.js';
import { calculateNextBuildingBuyPriceBatch, calculateNextWorkerBuyPriceBatch } from '../utils/formulas.js';
import { getActiveSeason } from '../utils/utils.js';

const getWorkerAvgPrices = async ({ timeMode, blockMode }) => {
  if (!['1d', '5d'].includes(timeMode)) throw new Error('API error: Invalid time mode');
  if (!['5m', '10m', '15m', '30m', '1h', '2h', '4h', '6h'].includes(blockMode))
    throw new Error('API error: Invalid block mode');

  const activeSeason = await getActiveSeason();
  const now = Date.now();
  const numberOfDays = timeMode === '1d' ? 1 : 5;
  const startTimeUnix = now - numberOfDays * 24 * 60 * 60 * 1000;

  const potentialTxnSnapshot = await firestore
    .collection('transaction')
    .where('seasonId', '==', activeSeason.id)
    .where('type', '==', 'buy-worker')
    .where('status', '==', 'Success')
    .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(startTimeUnix - 12 * 60 * 60 * 1000))
    .orderBy('createdAt', 'asc')
    .get();

  const potentialTxns = potentialTxnSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate().getTime(),
  }));
  const txns = potentialTxns.filter((txn) => txn.createdAt >= startTimeUnix);

  const gap = gaps[blockMode];
  const startBlockTimes = [startTimeUnix];
  let nextStartTime = startTimeUnix + gap;
  while (nextStartTime < now) {
    startBlockTimes.push(nextStartTime);
    nextStartTime += gap;
  }

  const avgPrices = [];
  for (let i = 0; i < startBlockTimes.length; i++) {
    const startTime = startBlockTimes[i];
    const nextStartTime = startBlockTimes[i + 1];
    const firstTxn = txns.find(
      (item) => item.createdAt > startTime && (!nextStartTime || item.createdAt < nextStartTime)
    );

    if (firstTxn) {
      avgPrices.push({ startAt: startTime, value: firstTxn.prices[0] });
    } else {
      const { worker } = activeSeason;

      const startSalePeriod = startTime - 12 * 60 * 60 * 1000;
      const workerTxns = potentialTxns.filter(
        (txn) => txn.createdAt >= startSalePeriod && (!nextStartTime || txn.createdAt < nextStartTime)
      );

      const workerSalesLastPeriod = workerTxns.reduce((total, doc) => total + doc.amount, 0);
      const workerPrices = calculateNextWorkerBuyPriceBatch(
        workerSalesLastPeriod,
        worker.targetDailyPurchase,
        worker.targetPrice,
        worker.basePrice,
        1
      );

      avgPrices.push({ startAt: startTime, value: workerPrices.prices[0] });
    }
  }

  return avgPrices;
};

const getBuildingAvgPrices = async ({ timeMode, blockMode }) => {
  if (!['1d', '5d'].includes(timeMode)) throw new Error('API error: Invalid time mode');
  if (!['5m', '10m', '15m', '30m', '1h', '2h', '4h', '6h'].includes(blockMode))
    throw new Error('API error: Invalid block mode');

  const activeSeason = await getActiveSeason();
  const now = Date.now();
  const numberOfDays = timeMode === '1d' ? 1 : 5;
  const startTimeUnix = now - numberOfDays * 24 * 60 * 60 * 1000;

  const potentialTxnSnapshot = await firestore
    .collection('transaction')
    .where('seasonId', '==', activeSeason.id)
    .where('type', '==', 'buy-building')
    .where('status', '==', 'Success')
    .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(startTimeUnix - 12 * 60 * 60 * 1000))
    .orderBy('createdAt', 'asc')
    .get();

  const potentialTxns = potentialTxnSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate().getTime(),
  }));
  const txns = potentialTxns.filter((txn) => txn.createdAt >= startTimeUnix);

  const gap = gaps[blockMode];
  const startBlockTimes = [startTimeUnix];
  let nextStartTime = startTimeUnix + gap;
  while (nextStartTime < now) {
    startBlockTimes.push(nextStartTime);
    nextStartTime += gap;
  }

  const avgPrices = [];
  for (let i = 0; i < startBlockTimes.length; i++) {
    const startTime = startBlockTimes[i];
    const nextStartTime = startBlockTimes[i + 1];
    const firstTxn = txns.find(
      (item) => item.createdAt > startTime && (!nextStartTime || item.createdAt < nextStartTime)
    );

    if (firstTxn) {
      avgPrices.push({ startAt: startTime, value: firstTxn.prices[0] });
    } else {
      const { building } = activeSeason;

      const startSalePeriod = startTime - 12 * 60 * 60 * 1000;
      const buildingTxns = potentialTxns.filter(
        (txn) => txn.createdAt >= startSalePeriod && (!nextStartTime || txn.createdAt < nextStartTime)
      );

      const buildingSalesLastPeriod = buildingTxns.reduce((total, doc) => total + doc.amount, 0);
      const buildingPrices = calculateNextBuildingBuyPriceBatch(
        buildingSalesLastPeriod,
        building.targetDailyPurchase,
        building.targetPrice,
        building.basePrice,
        1
      );

      avgPrices.push({ startAt: startTime, value: buildingPrices.prices[0] });
    }
  }

  return avgPrices;
};

const timeMode = '5d';
const blockMode = '1h';
const gaps = {
  '5m': 5 * 60 * 1000,
  '10m': 10 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 1 * 60 * 60 * 1000,
  '2h': 2 * 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
};

const main = async () => {
  console.log('extract goon price...');
  const goonAvgPrices = await getWorkerAvgPrices({ timeMode, blockMode });
  fs.writeFileSync('./goon-avg-prices.json', JSON.stringify(goonAvgPrices, null, 2), { encoding: 'utf-8' });
  console.log('extracted goon price');

  console.log('extract safehouse price ...');
  const safehouseAvgPrices = await getBuildingAvgPrices({ timeMode, blockMode });
  fs.writeFileSync('./safehouse-avg-prices.json', JSON.stringify(safehouseAvgPrices, null, 2), { encoding: 'utf-8' });
  console.log('extracted safehouse price');
};

main()
  .then(() => console.log('done'))
  .catch(console.error);
