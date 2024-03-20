import moment from 'moment';

import admin, { firestore } from '../configs/admin.config.js';
import { getActiveSeason } from '../utils/utils.js';
import { calculateNextBuildingBuyPrice, calculateNextWorkerBuyPrice } from '../utils/formulas.js';

const main = async () => {
  const activeSeason = await getActiveSeason();
  const { startTime, worker, building } = activeSeason;

  const now = Date.now();
  const startUnixTime = startTime.toDate().getTime();
  let nextEvenHourUnixTime = moment(new Date(startUnixTime)).startOf('d').toDate().getTime();
  const moment30Mins = [];
  while (nextEvenHourUnixTime < now) {
    moment30Mins.push(nextEvenHourUnixTime);
    nextEvenHourUnixTime += 0.5 * 60 * 60 * 1000;
  }

  console.log('calculate buy worker txns');
  const workerTxnSnapshot = await firestore
    .collection('transaction')
    .where('seasonId', '==', activeSeason.id)
    .where('type', '==', 'buy-worker')
    .where('status', '==', 'Success')
    .orderBy('createdAt', 'asc')
    .get();
  const workerTxns = workerTxnSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const formattedWorkerTxns = workerTxns.map((txn) => ({
    txnId: txn.id,
    createdAt: txn.createdAt,
    avgPrice: txn.value / txn.prices.length,
    seasonId: activeSeason.id,
  }));
  const workerPriceEvery30Mins = moment30Mins.map((time) => {
    const startSalePeriod = time - 12 * 60 * 60 * 1000;
    const lastSaleTxns = workerTxns.filter(
      (txn) => txn.createdAt.toDate().getTime() >= startSalePeriod && txn.createdAt.toDate().getTime() < time
    );

    const salesLastPeriod = lastSaleTxns.reduce((total, doc) => total + doc.amount, 0);
    const price = calculateNextWorkerBuyPrice(
      salesLastPeriod,
      worker.targetDailyPurchase,
      worker.targetPrice,
      worker.basePrice
    );

    return {
      txnId: null,
      createdAt: admin.firestore.Timestamp.fromMillis(time),
      avgPrice: price,
      seasonId: activeSeason.id,
    };
  });

  const workerPromises = [...formattedWorkerTxns, ...workerPriceEvery30Mins].map((item) =>
    firestore.collection('worker-txn-prices').add({
      ...item,
    })
  );
  let i = 0;
  for (const workerPromise of workerPromises) {
    console.log(`${++i}/${workerPromises.length}`);
    await workerPromise;
  }
  console.log('calculate buy worker txns done');

  console.log('calculate buy building txns');
  const buildingTxnSnapshot = await firestore
    .collection('transaction')
    .where('seasonId', '==', activeSeason.id)
    .where('type', '==', 'buy-building')
    .where('status', '==', 'Success')
    .orderBy('createdAt', 'asc')
    .get();
  const buildingTxns = buildingTxnSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const formattedBuildingTxns = buildingTxns.map((txn) => ({
    txnId: txn.id,
    createdAt: txn.createdAt,
    avgPrice: txn.value / txn.prices.length,
    seasonId: activeSeason.id,
  }));
  const buildingPriceEvery30Mins = moment30Mins.map((time) => {
    const startSalePeriod = time - 12 * 60 * 60 * 1000;
    const lastSaleTxns = buildingTxns.filter(
      (txn) => txn.createdAt.toDate().getTime() >= startSalePeriod && txn.createdAt.toDate().getTime() < time
    );

    const salesLastPeriod = lastSaleTxns.reduce((total, doc) => total + doc.amount, 0);
    const price = calculateNextBuildingBuyPrice(
      salesLastPeriod,
      building.targetDailyPurchase,
      building.targetPrice,
      building.basePrice
    );

    return {
      txnId: null,
      createdAt: admin.firestore.Timestamp.fromMillis(time),
      avgPrice: price,
      seasonId: activeSeason.id,
    };
  });

  const buildingPromises = [...formattedBuildingTxns, ...buildingPriceEvery30Mins].map((item) =>
    firestore.collection('building-txn-prices').add({
      ...item,
    })
  );

  i = 0;
  for (const buildingPromise of buildingPromises) {
    console.log(`${++i}/${buildingPromises.length}`);
    await buildingPromise;
  }
  console.log('calculate buy building txns done');
};

main()
  .then(() => console.log('done!'))
  .catch((err) => console.error(err));
