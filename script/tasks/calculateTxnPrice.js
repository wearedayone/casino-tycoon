import moment from 'moment';

import admin, { firestore } from '../configs/admin.config.js';
import { getActiveSeason } from '../utils/utils.js';
import { calculateNextBuildingBuyPrice, calculateNextWorkerBuyPrice } from '../utils/formulas.js';

const cleanTxnPrice = async ({ startTime }) => {
  const workerTxnPrices = await firestore
    .collection('worker-txn-prices')
    .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(startTime))
    .get();
  if (!workerTxnPrices.empty) {
    const deletes = workerTxnPrices.docs.map(async (doc) => {
      doc.ref.delete();
    });
    await Promise.all(deletes);
  }

  const buildingTxnPrices = await firestore
    .collection('building-txn-prices')

    .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(startTime))
    .get();
  if (!buildingTxnPrices.empty) {
    const deletes = buildingTxnPrices.docs.map(async (doc) => {
      doc.ref.delete();
    });
    await Promise.all(deletes);
  }
};

const cleanAllAutoTxnPrice = async () => {
  const workerTxnPrices = await firestore
    .collection('worker-txn-prices')
    .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(1711762200000))
    .where('createdAt', '<', admin.firestore.Timestamp.fromMillis(1711848600000))
    .where('txnId', '==', null)
    .get();
  if (!workerTxnPrices.empty) {
    const deletes = workerTxnPrices.docs.map(async (doc) => {
      doc.ref.delete();
    });
    await Promise.all(deletes);
  }

  const buildingTxnPrices = await firestore
    .collection('building-txn-prices')
    .where('txnId', '==', null)
    .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(1711762200000))
    .where('createdAt', '<', admin.firestore.Timestamp.fromMillis(1711848600000))
    .get();
  if (!buildingTxnPrices.empty) {
    const deletes = buildingTxnPrices.docs.map(async (doc) => {
      doc.ref.delete();
    });
    await Promise.all(deletes);
  }
};

const generateTxnPrice = async () => {
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

  let listTxns = [...formattedWorkerTxns, ...workerPriceEvery30Mins];
  let i = 0;
  for (const item of listTxns) {
    if (item.txnId) {
      console.log(`${++i}/${listTxns.length}: update`);
      await firestore
        .collection('worker-txn-prices')
        .doc(item.txnId)
        .set({
          ...item,
        });
    } else {
      console.log(`${++i}/${listTxns.length}: Add New`);
      await firestore.collection('worker-txn-prices').add({
        ...item,
      });
    }
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

  listTxns = [...formattedBuildingTxns, ...buildingPriceEvery30Mins];
  i = 0;
  for (const item of listTxns) {
    if (item.txnId) {
      console.log(`${++i}/${listTxns.length}: update`);
      await firestore
        .collection('building-txn-prices')
        .doc(item.txnId)
        .set({
          ...item,
        });
    } else {
      console.log(`${++i}/${listTxns.length}: Add New`);
      await firestore.collection('building-txn-prices').add({
        ...item,
      });
    }
  }
  console.log('calculate buy building txns done');
};

const generateTxnPriceForExistTxn = async () => {
  const activeSeason = await getActiveSeason();
  const { startTime, worker, building } = activeSeason;

  console.log('calculate buy worker txns');
  const workerTxnSnapshot = await firestore
    .collection('transaction')
    .where('seasonId', '==', activeSeason.id)
    .where('type', '==', 'buy-worker')
    .where('status', '==', 'Success')
    .orderBy('createdAt', 'asc')
    .get();
  const workerTxns = workerTxnSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

  const formattedWorkerTxns = workerTxns.map((txn) => ({
    txnId: txn.id,
    createdAt: txn.createdAt,
    avgPrice: txn.value / txn.prices.length,
    seasonId: activeSeason.id,
  }));

  let listTxns = [...formattedWorkerTxns];
  let i = 0;
  for (const item of listTxns) {
    if (item.txnId) {
      console.log(`${++i}/${listTxns.length}: update`);
      await firestore
        .collection('worker-txn-prices')
        .doc(item.txnId)
        .set({
          ...item,
        });
    } else {
      console.log(`${++i}/${listTxns.length}: Add New`);
      await firestore.collection('worker-txn-prices').add({
        ...item,
      });
    }
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
  const buildingTxns = buildingTxnSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

  const formattedBuildingTxns = buildingTxns.map((txn) => ({
    txnId: txn.id,
    createdAt: txn.createdAt,
    avgPrice: txn.value / txn.prices.length,
    seasonId: activeSeason.id,
  }));

  listTxns = [...formattedBuildingTxns];
  i = 0;
  for (const item of listTxns) {
    if (item.txnId) {
      console.log(`${++i}/${listTxns.length}: update`);
      await firestore
        .collection('building-txn-prices')
        .doc(item.txnId)
        .set({
          ...item,
        });
    } else {
      console.log(`${++i}/${listTxns.length}: Add New`);
      await firestore.collection('building-txn-prices').add({
        ...item,
      });
    }
  }
  console.log('calculate buy building txns done');

  console.log('calculate buy machine txns');
  const machineTxnSnapshot = await firestore
    .collection('transaction')
    .where('seasonId', '==', activeSeason.id)
    .where('type', '==', 'buy-machine')
    .where('status', '==', 'Success')
    .orderBy('createdAt', 'asc')
    .get();
  const machineTxns = machineTxnSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

  const formattedMachineTxns = machineTxns.map((txn) => ({
    txnId: txn.id,
    createdAt: txn.createdAt,
    avgPrice: txn.value / txn.prices.length,
    seasonId: activeSeason.id,
  }));

  listTxns = [...formattedMachineTxns];
  i = 0;
  for (const item of listTxns) {
    if (item.txnId) {
      console.log(`${++i}/${listTxns.length}: update`);
      await firestore
        .collection('machine-txn-prices')
        .doc(item.txnId)
        .set({
          ...item,
        });
    } else {
      console.log(`${++i}/${listTxns.length}: Add New`);
      await firestore.collection('machine-txn-prices').add({
        ...item,
      });
    }
  }
  console.log('calculate buy machine txns done');
};

const generateTxnPrice30Min = async ({ endTime }) => {
  const activeSeason = await getActiveSeason();
  const { startTime, worker, building } = activeSeason;

  const now = endTime;
  // const startUnixTime = startTime.toDate().getTime();
  const startUnixTime = 1711805400000;
  let nextEvenHourUnixTime = moment(new Date(startUnixTime)).toDate().getTime();
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

  let listTxns = [...workerPriceEvery30Mins];
  let i = 0;
  for (const item of listTxns) {
    console.log(`${++i}/${listTxns.length}: Add New`);
    await firestore.collection('worker-txn-prices').add({
      ...item,
    });
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

  listTxns = [...buildingPriceEvery30Mins];
  i = 0;
  for (const item of listTxns) {
    console.log(`${++i}/${listTxns.length}: Add New`);
    await firestore.collection('building-txn-prices').add({
      ...item,
    });
  }
  console.log('calculate buy building txns done');
};

const main = async () => {
  // await generateTxnPrice();
  // await cleanTxnPrice({ startTime: 1711762200000 });
  await generateTxnPriceForExistTxn();
  // await cleanAllAutoTxnPrice();
  // await generateTxnPrice30Min({ endTime: 1711848600000 });
};

main()
  .then(() => console.log('done!'))
  .catch((err) => console.error(err));
