import moment from 'moment';

import admin, { firestore } from '../configs/admin.config.js';

const startTime = 1711675800000; // 8h30 GMT+7 29/3/24
const endTime = 1711762200000; // 8h30 GMT+7 30/3/24
const activeSeasonId = 'ZteHVCoKgpnMvg1tHTfj';

const cleanGhostTxn = async () => {
  const ghostTxns = await firestore
    .collection('transaction')
    .where('seasonId', '==', activeSeasonId)
    .where('userId', '==', 'ghost-user')
    .get();

  for (const txn of ghostTxns.docs) {
    const { createdAt } = txn.data();
    if (createdAt.toMillis() >= endTime) {
      console.log(`delete ${txn.id}`);
      await txn.ref.delete();
    }
  }
};

const cloneAllTxn = async () => {
  const buildingTxns = await firestore
    .collection('transaction')
    .where('seasonId', '==', activeSeasonId)
    .where('type', '==', 'buy-building')
    .where('status', '==', 'Success')
    .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(startTime))
    .where('createdAt', '<', admin.firestore.Timestamp.fromMillis(endTime))
    .get();
  const workerTxns = await firestore
    .collection('transaction')
    .where('seasonId', '==', activeSeasonId)
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
    promises.push(cloneTxn({ txn: { id: doc.id, ...doc.data() }, getNewTimestamp: addOneDayToTimestamp }));
  });
  workerTxns.docs.forEach((doc) => {
    promises.push(cloneTxn({ txn: { id: doc.id, ...doc.data() }, getNewTimestamp: addOneDayToTimestamp }));
  });

  await Promise.all(promises);
};

export const cloneTxn = async ({ txn, getNewTimestamp }) => {
  console.log(`init ghost transaction: - old txn:${JSON.stringify(txn, null, 2)}`);
  const transaction = {
    ...txn,
    originTxnId: txn.id,
    userId: 'ghost-user',
    createdAt: admin.firestore.Timestamp.fromMillis(getNewTimestamp(txn.createdAt)),
  };
  const ghostTxn = await firestore.collection('transaction').where('originTxnId', '==', txn.id).limit(1).get();

  if (ghostTxn.empty) {
    const newTxn = await firestore.collection('transaction').add(transaction);

    if (txn.type == 'buy-building') {
      await firestore
        .collection('building-txn-prices')
        .doc(txn.id)
        .set({
          seasonId: activeSeasonId,
          txnId: newTxn.id,
          avgPrice: txn.value / txn.amount,
          createdAt: admin.firestore.Timestamp.fromMillis(getNewTimestamp(txn.createdAt)),
        });
    } else if (txn.type == 'buy-worker') {
      await firestore
        .collection('worker-txn-prices')
        .doc(txn.id)
        .set({
          seasonId: activeSeasonId,
          txnId: newTxn.id,
          avgPrice: txn.value / txn.amount,
          createdAt: admin.firestore.Timestamp.fromMillis(getNewTimestamp(txn.createdAt)),
        });
    }
  } else {
    const ghostTxnData = ghostTxn.docs[0].data();
    if (ghostTxnData.type == 'buy-building') {
      await firestore
        .collection('building-txn-prices')
        .doc(txn.id)
        .set({
          seasonId: activeSeasonId,
          txnId: ghostTxn.id,
          avgPrice: txn.value / txn.amount,
          createdAt: admin.firestore.Timestamp.fromMillis(getNewTimestamp(txn.createdAt)),
        });
    } else if (ghostTxnData.type == 'buy-worker') {
      await firestore
        .collection('worker-txn-prices')
        .doc(txn.id)
        .set({
          seasonId: activeSeasonId,
          txnId: ghostTxn.id,
          avgPrice: txn.value / txn.amount,
          createdAt: admin.firestore.Timestamp.fromMillis(getNewTimestamp(txn.createdAt)),
        });
    }
  }
};

const main = async () => {
  await cleanGhostTxn();
  await cloneAllTxn();
};
main()
  .then(() => console.log(`\nDone populating goons & safehouse buy`))
  .then(process.exit)
  .catch((err) => console.error(err));
