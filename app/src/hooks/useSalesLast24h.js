import { useState, useEffect } from 'react';
import { onSnapshot, collection, where, query, Timestamp } from 'firebase/firestore';

import { firestore } from '../configs/firebase.config';
import useSystemStore from '../stores/system.store';

const MILISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;

const useSalesLast24h = () => {
  const [listening, setListening] = useState(false);
  const [workerSoldLast24h, setWorkerSoldLast24h] = useState(0);
  const [buildingSoldLast24h, setBuildingSoldLast24h] = useState(0);
  const configs = useSystemStore((state) => state.configs);

  useEffect(() => {
    let unsubscribeWorker, unsubscribeBuilding;
    if (listening) {
      const now = Date.now();
      const startTime = now - MILISECONDS_IN_A_DAY;
      const workerQuery = query(
        collection(firestore, 'transaction'),
        where('seasonId', '==', configs?.activeSeasonId || null),
        where('type', '==', 'buy-worker'),
        where('status', '==', 'Success'),
        where('createdAt', '>=', Timestamp.fromMillis(startTime))
      );
      unsubscribeWorker = onSnapshot(workerQuery, (snapshot) => {
        console.log(
          'worker txn count: ',
          snapshot.size,
          snapshot.docs.map((doc) => ({ id: doc.id, amount: doc.data().amount }))
        );
        setWorkerSoldLast24h(snapshot.docs.reduce((total, doc) => total + doc.data().amount, 0));
      });

      const buildingQuery = query(
        collection(firestore, 'transaction'),
        where('seasonId', '==', configs?.activeSeasonId || null),
        where('type', '==', 'buy-building'),
        where('status', '==', 'Success'),
        where('createdAt', '>=', Timestamp.fromMillis(startTime))
      );
      unsubscribeBuilding = onSnapshot(buildingQuery, (snapshot) => {
        console.log(
          'building txn count: ',
          snapshot.size,
          snapshot.docs.map((doc) => ({ id: doc.id, amount: doc.data().amount }))
        );
        setBuildingSoldLast24h(snapshot.docs.reduce((total, doc) => total + doc.data().amount, 0));
      });
    } else {
      unsubscribeWorker?.();
      unsubscribeBuilding?.();
    }

    return () => {
      unsubscribeWorker?.();
      unsubscribeBuilding?.();
    };
  }, [listening, configs?.activeSeasonId]);

  const enableSalesTracking = () => setListening(true);
  const disableSalesTracking = () => setListening(false);

  return {
    workerSoldLast24h,
    buildingSoldLast24h,
    enableSalesTracking,
    disableSalesTracking,
  };
};

export default useSalesLast24h;
