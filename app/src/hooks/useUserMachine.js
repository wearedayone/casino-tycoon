import { useEffect } from 'react';
import { onSnapshot, query, collection } from 'firebase/firestore';

import { firestore } from '../configs/firebase.config';
import useSystemStore from '../stores/system.store';
import useUserStore from '../stores/user.store';

const useUserMachine = () => {
  const userId = useUserStore((state) => state.profile?.id);
  const setMachines = useUserStore((state) => state.setMachines);
  const configs = useSystemStore((state) => state.configs);
  const { activePoolId } = configs || {};

  useEffect(() => {
    let unsubscribe;
    if (userId && activePoolId) {
      const q = query(
        collection(firestore, 'user', userId, 'pool', activePoolId, 'machine')
      );
      unsubscribe = onSnapshot(q, (snapshot) => {
        setMachines(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
        );
      });
    } else {
      setMachines([]);
    }

    return () => unsubscribe?.();
  }, [userId, activePoolId]);
};

export default useUserMachine;
