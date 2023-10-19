import { useEffect } from 'react';
import { onSnapshot, query, collection } from 'firebase/firestore';

import { firestore } from '../configs/firebase.config';
import useSystemStore from '../stores/system.store';
import useUserStore from '../stores/user.store';

const useUserWorker = () => {
  const userId = useUserStore((state) => state.profile?.id);
  const setWorkers = useUserStore((state) => state.setWorkers);
  const configs = useSystemStore((state) => state.configs);
  const { activePoolId } = configs || {};

  useEffect(() => {
    let unsubscribe;
    if (userId && activePoolId) {
      const q = query(
        collection(firestore, 'user', userId, 'pool', activePoolId, 'worker')
      );
      unsubscribe = onSnapshot(q, (snapshot) => {
        setWorkers(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
        );
      });
    } else {
      setWorkers([]);
    }

    return () => unsubscribe?.();
  }, [userId, activePoolId]);
};

export default useUserWorker;
