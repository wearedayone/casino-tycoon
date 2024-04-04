import { useEffect } from 'react';
import { onSnapshot, where, collection, query, Timestamp } from 'firebase/firestore';
import moment from 'moment';

import useSpinStore from '../stores/spin.store';
import useSystemStore from '../stores/system.store';
import { firestore } from '../configs/firebase.config';

const useLastSpin = () => {
  const setSpinned = useSpinStore((state) => state.setSpinned);
  const setInitialized = useSpinStore((state) => state.setInitialized);
  const configs = useSystemStore((state) => state.configs);

  useEffect(() => {
    let unsubscribe;

    if (configs?.activeSeasonId) {
      const utcDate = moment().utc().format('DD/MM/YYYY');
      const todayStartTime = moment(`${utcDate} 00:00:00`, 'DD/MM/YYYY HH:mm:ss').utc(true).toDate().getTime();
      const q = query(
        collection(firestore, 'transaction'),
        where('seasonId', '==', configs?.activeSeasonId || null),
        where('type', '==', 'daily-spin'),
        where('status', 'in', ['Success', 'Pending']),
        where('createdAt', '>=', Timestamp.fromMillis(todayStartTime))
      );
      unsubscribe = onSnapshot(q, (snapshot) => {
        console.log(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setSpinned(!snapshot.empty);
        setInitialized(true);
      });
    } else {
      unsubscribe?.();
    }

    return () => {
      unsubscribe?.();
    };
  }, [configs?.activeSeasonId]);
};

export default useLastSpin;
