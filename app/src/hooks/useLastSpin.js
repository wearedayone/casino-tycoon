import { useEffect } from 'react';
import { onSnapshot, where, collection, query, Timestamp } from 'firebase/firestore';
import moment from 'moment';

import useSpinStore from '../stores/spin.store';
import useSystemStore from '../stores/system.store';
import useUserStore from '../stores/user.store';
import { firestore } from '../configs/firebase.config';

const useLastSpin = () => {
  const userId = useUserStore((state) => state.profile?.id);
  const setSpinned = useSpinStore((state) => state.setSpinned);
  const setInitialized = useSpinStore((state) => state.setInitialized);
  const activeSeasonId = useSystemStore((state) => state.configs?.activeSeasonId);

  useEffect(() => {
    let unsubscribe;

    if (activeSeasonId && userId) {
      const utcDate = moment().utc().format('DD/MM/YYYY');
      const todayStartTime = moment(`${utcDate} 00:00:00`, 'DD/MM/YYYY HH:mm:ss').utc(true).toDate().getTime();
      const q = query(
        collection(firestore, 'transaction'),
        where('seasonId', '==', activeSeasonId || null),
        where('type', '==', 'daily-spin'),
        where('userId', '==', userId),
        where('status', 'in', ['Success', 'Pending']),
        where('createdAt', '>=', Timestamp.fromMillis(todayStartTime))
      );
      unsubscribe = onSnapshot(q, (snapshot) => {
        setSpinned(!snapshot.empty);
        setInitialized(true);
      });
    } else {
      unsubscribe?.();
    }

    return () => {
      unsubscribe?.();
    };
  }, [activeSeasonId, userId]);
};

export default useLastSpin;
