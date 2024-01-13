import { useState, useEffect } from 'react';
import { onSnapshot, collection, where, query, Timestamp } from 'firebase/firestore';

import { firestore } from '../configs/firebase.config';

const MILISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;
const MILISECONDS_IN_7_DAYS = 7 * MILISECONDS_IN_A_DAY;

const useSalesLast24h = () => {
  const [now, setNow] = useState(Date.now());
  const [workerSoldLast24h, setWorkerSoldLast24h] = useState(0);
  const [buildingSoldLast24h, setBuildingSoldLast24h] = useState(0);

  useEffect(() => {
    const startTime = now - MILISECONDS_IN_7_DAYS;
    console.log({ startTime });
    const workerQuery = query(
      collection(firestore, 'transaction'),
      where('type', '==', 'buy-worker'),
      where('status', '==', 'Success'),
      where('createdAt', '>=', Timestamp.fromMillis(startTime))
    );
    const unsubscribeWorker = onSnapshot(workerQuery, (snapshot) => {
      console.log(
        'worker txn count: ',
        snapshot.size,
        snapshot.docs.map((doc) => ({ id: doc.id, amount: doc.data().amount }))
      );
      setWorkerSoldLast24h(snapshot.docs.reduce((total, doc) => total + doc.data().amount, 0));
    });

    const buildingQuery = query(
      collection(firestore, 'transaction'),
      where('type', '==', 'buy-building'),
      where('status', '==', 'Success'),
      where('createdAt', '>=', Timestamp.fromMillis(startTime))
    );
    const unsubscribeBuilding = onSnapshot(buildingQuery, (snapshot) => {
      setBuildingSoldLast24h(snapshot.docs.reduce((total, doc) => total + doc.data().amount, 0));
    });

    return () => {
      unsubscribeWorker();
      unsubscribeBuilding();
    };
  }, [now]);

  const updateNow = () => setNow(Date.now());

  return {
    updateNow,
    workerSoldLast24h,
    buildingSoldLast24h,
  };
};

export default useSalesLast24h;
