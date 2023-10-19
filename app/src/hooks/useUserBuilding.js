import { useEffect } from 'react';
import { onSnapshot, query, collection } from 'firebase/firestore';

import { firestore } from '../configs/firebase.config';
import useSystemStore from '../stores/system.store';
import useUserStore from '../stores/user.store';

const useUserBuilding = () => {
  const userId = useUserStore((state) => state.profile?.id);
  const setBuildings = useUserStore((state) => state.setBuildings);
  const configs = useSystemStore((state) => state.configs);
  const { activePoolId } = configs || {};

  useEffect(() => {
    let unsubscribe;
    if (userId && activePoolId) {
      const q = query(
        collection(firestore, 'user', userId, 'pool', activePoolId, 'building')
      );
      unsubscribe = onSnapshot(q, (snapshot) => {
        setBuildings(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
        );
      });
    } else {
      setBuildings([]);
    }

    return () => unsubscribe?.();
  }, [userId, activePoolId]);
};

export default useUserBuilding;
