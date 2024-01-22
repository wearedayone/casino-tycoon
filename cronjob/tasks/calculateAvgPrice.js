import moment from 'moment';
import admin, { firestore } from '../configs/admin.config.js';

const calculateAvgPrice = async () => {
  try {
    console.log('start calculateAvgPrice');
    const now = moment().utc();
    const endTime = now.startOf('day').toDate().getTime();
    const startTime = endTime - 24 * 60 * 60 * 1000;
    const endTimestamp = admin.firestore.Timestamp.fromMillis(endTime);
    const startTimestamp = admin.firestore.Timestamp.fromMillis(startTime);
    const today = now.subtract(1, 'day').format('DD-MM-YYYY');
    const date = now.subtract(1, 'day').format('DD/MM');

    const configs = await firestore.collection('system').doc('default').get();
    const { activeSeasonId } = configs.data();

    const workerTxns = await firestore
      .collection('transaction')
      .where('type', '==', 'buy-worker')
      .where('status', '==', 'Success')
      .where('createdAt', '>=', startTimestamp)
      .where('createdAt', '<', endTimestamp)
      .get();

    console.log(`Worker txn ${today} count: ${workerTxns.size}`);

    const allWorkerPrices = workerTxns.docs.reduce((result, doc) => [...result, ...doc.data().prices], []);
    if (allWorkerPrices.length) {
      const totalWorkerPrices = allWorkerPrices.reduce((total, price) => total + price, 0);
      const avgWorkerPrice = Number((totalWorkerPrices / allWorkerPrices.length).toFixed(1));
      await firestore
        .collection('season')
        .doc(activeSeasonId)
        .collection('worker-price')
        .doc(today)
        .set({ date, value: avgWorkerPrice, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    } else {
      await firestore
        .collection('season')
        .doc(activeSeasonId)
        .collection('worker-price')
        .doc(today)
        .set({ date, value: 0, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    }

    const buildingTxns = await firestore
      .collection('transaction')
      .where('type', '==', 'buy-building')
      .where('status', '==', 'Success')
      .where('createdAt', '>=', startTimestamp)
      .where('createdAt', '<=', endTimestamp)
      .get();

    console.log(`Building txn ${today} count: ${buildingTxns.size}`);

    const allBuildingPrices = buildingTxns.docs.reduce((result, doc) => [...result, ...doc.data().prices], []);
    if (allBuildingPrices.length) {
      const totalBuildingPrices = allBuildingPrices.reduce((total, price) => total + price, 0);
      const avgBuildingPrice = Number((totalBuildingPrices / allBuildingPrices.length).toFixed(1));
      await firestore
        .collection('season')
        .doc(activeSeasonId)
        .collection('building-price')
        .doc(today)
        .set({ date, value: avgBuildingPrice, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    } else {
      await firestore
        .collection('season')
        .doc(activeSeasonId)
        .collection('building-price')
        .doc(today)
        .set({ date, value: 0, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    }
  } catch (err) {
    console.error(err);
  }
};

export default calculateAvgPrice;
