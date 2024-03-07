import { useState, useEffect } from 'react';
import { onSnapshot, collection, where, query, Timestamp } from 'firebase/firestore';

import { firestore } from '../configs/firebase.config';
import useSystemStore from '../stores/system.store';

const MILISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;

const useSalesLast24h = () => {
  const [listeningWorker, setListeningWorker] = useState(false);
  const [listeningBuilding, setListeningBuilding] = useState(false);
  const [workerSoldLast24h, setWorkerSoldLast24h] = useState(0);
  const [buildingSoldLast24h, setBuildingSoldLast24h] = useState(0);
  const configs = useSystemStore((state) => state.configs);

  useEffect(() => {
    let unsubscribe;
    if (listeningWorker) {
      const now = Date.now();
      const startTime = now - MILISECONDS_IN_A_DAY;
      const workerQuery = query(
        collection(firestore, 'transaction'),
        where('seasonId', '==', configs?.activeSeasonId || null),
        where('type', '==', 'buy-worker'),
        where('status', '==', 'Success'),
        where('createdAt', '>=', Timestamp.fromMillis(startTime))
      );
      unsubscribe = onSnapshot(workerQuery, (snapshot) => {
        console.log(
          'worker txn count: ',
          snapshot.size,
          snapshot.docs.map((doc) => ({ id: doc.id, amount: doc.data().amount }))
        );
        setWorkerSoldLast24h(snapshot.docs.reduce((total, doc) => total + doc.data().amount, 0));
      });
    } else {
      unsubscribe?.();
    }

    return () => {
      unsubscribe?.();
    };
  }, [listeningWorker, configs?.activeSeasonId]);

  useEffect(() => {
    let unsubscribe;
    if (listeningBuilding) {
      const now = Date.now();
      const startTime = now - MILISECONDS_IN_A_DAY;

      const buildingQuery = query(
        collection(firestore, 'transaction'),
        where('seasonId', '==', configs?.activeSeasonId || null),
        where('type', '==', 'buy-building'),
        where('status', '==', 'Success'),
        where('createdAt', '>=', Timestamp.fromMillis(startTime))
      );
      unsubscribe = onSnapshot(buildingQuery, (snapshot) => {
        console.log(
          'building txn count: ',
          snapshot.size,
          snapshot.docs.map((doc) => ({ id: doc.id, amount: doc.data().amount }))
        );
        setBuildingSoldLast24h(snapshot.docs.reduce((total, doc) => total + doc.data().amount, 0));
      });
    } else {
      unsubscribe?.();
    }

    return () => {
      unsubscribe?.();
    };
  }, [listeningBuilding, configs?.activeSeasonId]);

  const enableWorkerSalesTracking = () => setListeningWorker(true);
  const disableWorkerSalesTracking = () => setListeningWorker(false);
  const enableBuildingSalesTracking = () => setListeningBuilding(true);
  const disableBuildingSalesTracking = () => setListeningBuilding(false);

  return {
    workerSoldLast24h,
    buildingSoldLast24h,
    enableWorkerSalesTracking,
    disableWorkerSalesTracking,
    enableBuildingSalesTracking,
    disableBuildingSalesTracking,
  };
};

export default useSalesLast24h;
