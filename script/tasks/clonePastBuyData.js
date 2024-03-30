import moment from 'moment';

import admin, { firestore } from '../configs/admin.config.js';

const startTime = 1711675800000; // 8h30 GMT+7 29/3/24
const endTime = 1711762200000; // 8h30 GMT+7 30/3/24

const getActiveSeason = async () => {
  const configs = await firestore.collection('system').doc('default').get();
  const { activeSeasonId } = configs.data();

  const snapshot = await firestore.collection('season').doc(activeSeasonId).get();

  return { id: snapshot.id, ...snapshot.data() };
};

const main = async () => {
  const activeSeason = await getActiveSeason();

  const buildingTxns = await firestore
    .collection('transaction')
    .where('seasonId', '==', activeSeason.id)
    .where('type', '==', 'buy-building')
    .where('status', '==', 'Success')
    .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(startTime))
    .where('createdAt', '<', admin.firestore.Timestamp.fromMillis(endTime))
    .get();
  const workerTxns = await firestore
    .collection('transaction')
    .where('seasonId', '==', activeSeason.id)
    .where('type', '==', 'buy-worker')
    .where('status', '==', 'Success')
    .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(startTime))
    .where('createdAt', '<', admin.firestore.Timestamp.fromMillis(endTime))
    .get();
  const addOneDayToTimestamp = (timestamp) => moment(timestamp.toDate().getTime()).add(1, 'day');
  const promises = [];

  console.log(`cloning ${buildingTxns.size} buy-building txns`);
  console.log(`cloning ${workerTxns.size} buy-worker txns`);

  buildingTxns.docs.forEach((doc) => {
    promises.push(cloneTxn({ txn: doc.data(), getNewTimestamp: addOneDayToTimestamp }));
  });
  workerTxns.docs.forEach((doc) => {
    promises.push(cloneTxn({ txn: doc.data(), getNewTimestamp: addOneDayToTimestamp }));
  });

  await Promise.all(promises);
};

export const cloneTxn = async ({ txn, getNewTimestamp }) => {
  console.log(`init ghost transaction: - old txn:${JSON.stringify(txn, null, 2)}`);

  const transaction = {
    ...txn,
    userId: 'ghost-user',
    createdAt: admin.firestore.Timestamp.fromMillis(getNewTimestamp(txn.createdAt)),
  };

  console.log('transaction', transaction);
  const newTransaction = await firestore.collection('transaction').add(transaction);

  return { id: newTransaction.id, ...transaction };
};

main()
  .then(() => console.log(`\nDone populating goons & safehouse buy`))
  .then(process.exit)
  .catch((err) => console.error(err));
