import admin, { firestore } from '../configs/admin.config.js';
import {
  calculateBuyAmountFromEndPrice,
  calculateNextBuildingBuyPriceBatch,
  calculateNextWorkerBuyPriceBatch,
} from '../utils/formulas.js';

const startTime = 1711762200000; // 8h30 GMT+7 30/3/24
const endTime = Date.now();
const endGoonPrice = 8500;
const endSafehousePrice = 20000;
const INTERVAL_DURATION = 10 * 60 * 1000; // create a ghost txn every 10 minutes

const getActiveSeason = async () => {
  const configs = await firestore.collection('system').doc('default').get();
  const { activeSeasonId } = configs.data();

  const snapshot = await firestore.collection('season').doc(activeSeasonId).get();

  return { id: snapshot.id, ...snapshot.data() };
};

const main = async () => {
  const activeSeason = await getActiveSeason();
  const numberOfHours = 12;
  const twelveHoursAgo = endTime - numberOfHours * 60 * 60 * 1000;

  const { building, worker } = activeSeason;
  const totalBuildingBuyAmountNeeded = calculateBuyAmountFromEndPrice(
    building.targetDailyPurchase,
    building.targetPrice,
    building.basePrice,
    endSafehousePrice
  );
  const totalWorkerBuyAmountNeeded = calculateBuyAmountFromEndPrice(
    worker.targetDailyPurchase,
    worker.targetPrice,
    worker.basePrice,
    endGoonPrice
  );

  console.log(
    'totalBuyAmountNeeded',
    'safehouse: ',
    totalBuildingBuyAmountNeeded,
    'goon: ',
    totalWorkerBuyAmountNeeded
  );

  const buildingLast12hTxns = await firestore
    .collection('transaction')
    .where('seasonId', '==', activeSeason.id)
    .where('type', '==', 'buy-building')
    .where('status', '==', 'Success')
    .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(twelveHoursAgo))
    .where('createdAt', '<', admin.firestore.Timestamp.fromMillis(endTime))
    .get();
  const workerLast12hTxns = await firestore
    .collection('transaction')
    .where('seasonId', '==', activeSeason.id)
    .where('type', '==', 'buy-worker')
    .where('status', '==', 'Success')
    .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(twelveHoursAgo))
    .where('createdAt', '<', admin.firestore.Timestamp.fromMillis(endTime))
    .get();

  const buildingSalesLastPeriod = buildingLast12hTxns.docs.reduce((total, doc) => total + doc.data().amount, 0);
  const workerSalesLastPeriod = workerLast12hTxns.docs.reduce((total, doc) => total + doc.data().amount, 0);

  const buildingPopulateAmount = Math.max(totalBuildingBuyAmountNeeded - buildingSalesLastPeriod, 0);
  const workerPopulateAmount = Math.max(totalWorkerBuyAmountNeeded - workerSalesLastPeriod, 0);

  console.log('populateAmount', 'safehouse: ', buildingPopulateAmount, 'goon: ', workerPopulateAmount);
  if (!buildingPopulateAmount && !workerPopulateAmount) return; // dont run if there's no need to do anything

  const startPopulateAt = Math.max(startTime, twelveHoursAgo);
  // aka txn count
  const txnCount = Math.ceil((endTime - startPopulateAt) / INTERVAL_DURATION);

  const buildingAmountPerTxn = Math.ceil(buildingPopulateAmount / txnCount);
  const buildingLastTxnAmount = buildingPopulateAmount - buildingAmountPerTxn * (txnCount - 1);
  const workerAmountPerTxn = Math.ceil(workerPopulateAmount / txnCount);
  const workerLastTxnAmount = workerPopulateAmount - workerAmountPerTxn * (txnCount - 1);

  console.log('txnCount', txnCount);
  console.log('buildingAmountPerTxn', buildingAmountPerTxn);
  console.log('buildingLastTxnAmount', buildingLastTxnAmount);
  console.log('workerAmountPerTxn', workerAmountPerTxn);
  console.log('workerLastTxnAmount', workerLastTxnAmount);

  return; // uncomment to run
  for (let i = 0; i < txnCount; i++) {
    const createdAt = startPopulateAt + i * INTERVAL_DURATION;
    const buildingAmount = i === txnCount - 1 ? buildingLastTxnAmount : buildingAmountPerTxn;
    const workerAmount = i === txnCount - 1 ? workerLastTxnAmount : workerAmountPerTxn;

    if (buildingAmount) {
      const buildingTxn = await createGhostTxn({ type: 'buy-building', createdAt, amount: buildingAmount });
      console.log('buildingTxn', buildingTxn);
    }

    if (workerAmount) {
      const workerTxn = await createGhostTxn({ type: 'buy-worker', createdAt, amount: workerAmount });
      console.log('workerTxn', workerTxn);
    }
  }
};

export const createGhostTxn = async ({ type, createdAt, ...data }) => {
  console.log(`init ghost transaction transaction user: - type:${type}`);
  const activeSeason = await getActiveSeason();

  // if run into this error, lower INTERVAL_DURATION and try again
  if (type === 'buy-worker') {
    if (data.amount > activeSeason.worker.maxPerBatch) throw new Error('API error: Bad request - over max per batch');
  }

  if (type === 'buy-building') {
    if (data.amount > activeSeason.building.maxPerBatch) throw new Error('API error: Bad request - over max per batch');
  }

  const { workerSold, buildingSold, worker, building } = activeSeason;
  const txnData = {};
  const now = Date.now();
  const startSalePeriod = now - 12 * 60 * 60 * 1000;
  switch (type) {
    case 'buy-worker':
      txnData.amount = data.amount;
      txnData.token = 'GREED';
      txnData.currentSold = workerSold;
      const workerTxns = await firestore
        .collection('transaction')
        .where('seasonId', '==', activeSeason.id)
        .where('type', '==', 'buy-worker')
        .where('status', '==', 'Success')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(startSalePeriod))
        .get();
      const workerSalesLastPeriod = workerTxns.docs.reduce((total, doc) => total + doc.data().amount, 0);
      const workerPrices = calculateNextWorkerBuyPriceBatch(
        workerSalesLastPeriod,
        worker.targetDailyPurchase,
        worker.targetPrice,
        worker.basePrice,
        data.amount
      );
      txnData.value = workerPrices.total;
      txnData.prices = workerPrices.prices;
      break;
    case 'buy-building':
      txnData.amount = data.amount;
      txnData.token = 'GREED';
      txnData.currentSold = buildingSold;
      const buildingTxns = await firestore
        .collection('transaction')
        .where('seasonId', '==', activeSeason.id)
        .where('type', '==', 'buy-building')
        .where('status', '==', 'Success')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(startSalePeriod))
        .get();
      const buildingSalesLastPeriod = buildingTxns.docs.reduce((total, doc) => total + doc.data().amount, 0);
      const buildingPrices = calculateNextBuildingBuyPriceBatch(
        buildingSalesLastPeriod,
        building.targetDailyPurchase,
        building.targetPrice,
        building.basePrice,
        data.amount
      );
      txnData.value = buildingPrices.total;
      txnData.prices = buildingPrices.prices;
      break;
    default:
      break;
  }

  // TODO: fix duplicate nonce
  await firestore
    .collection('system')
    .doc('data')
    .update({ nonce: admin.firestore.FieldValue.increment(1) });
  const systemData = await firestore.collection('system').doc('data').get();
  const { nonce } = systemData.data();
  const transaction = {
    userId: 'ghost-user',
    seasonId: activeSeason.id,
    type,
    txnHash: '',
    status: 'Success',
    nonce,
    createdAt: admin.firestore.Timestamp.fromMillis(createdAt),
    ...txnData,
  };
  const newTransaction = await firestore.collection('transaction').add(transaction);

  return { id: newTransaction.id, ...transaction };
};

main()
  .then(() => console.log(`\nDone populating goons & safehouse buy`))
  .then(process.exit)
  .catch((err) => console.error(err));
