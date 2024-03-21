import admin, { firestore } from '../configs/admin.config.js';
import { calculateNextBuildingBuyPrice, calculateNextWorkerBuyPrice } from '../utils/formulas.js';
import { getActiveSeason } from '../utils/utils.js';

const calculateTxnPrice = async () => {
  try {
    const activeSeason = await getActiveSeason();
    const { worker, building } = activeSeason;

    const now = Date.now();
    const startTimeUnix = now - 12 * 60 * 60 * 1000;

    console.log('Calculate worker txn price');
    const workerTxnSnapshot = await firestore
      .collection('transaction')
      .where('seasonId', '==', activeSeason.id)
      .where('type', '==', 'buy-worker')
      .where('status', '==', 'Success')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(startTimeUnix))
      .get();

    const workerSalesLastPeriod = workerTxnSnapshot.docs.reduce((total, doc) => total + doc.data().amount, 0);
    const workerPrice = calculateNextWorkerBuyPrice(
      workerSalesLastPeriod,
      worker.targetDailyPurchase,
      worker.targetPrice,
      worker.basePrice
    );
    await firestore.collection('worker-txn-prices').add({
      seasonId: activeSeason.id,
      txnId: null,
      createdAt: admin.firestore.Timestamp.fromMillis(now),
      avgPrice: workerPrice,
    });
    console.log('Calculate worker txn price done');

    console.log('Calculate building txn price');
    const buildingTxnSnapshot = await firestore
      .collection('transaction')
      .where('seasonId', '==', activeSeason.id)
      .where('type', '==', 'buy-building')
      .where('status', '==', 'Success')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(startTimeUnix))
      .get();

    const buildingSalesLastPeriod = buildingTxnSnapshot.docs.reduce((total, doc) => total + doc.data().amount, 0);
    const buildingPrice = calculateNextBuildingBuyPrice(
      buildingSalesLastPeriod,
      building.targetDailyPurchase,
      building.targetPrice,
      building.basePrice
    );
    await firestore.collection('building-txn-prices').add({
      seasonId: activeSeason.id,
      txnId: null,
      createdAt: admin.firestore.Timestamp.fromMillis(now),
      avgPrice: buildingPrice,
    });
    console.log('Calculate building txn price done');
  } catch (ex) {
    console.log(ex);
    console.error(ex);
  }
};

// calculateTxnPrice();

export default calculateTxnPrice;
