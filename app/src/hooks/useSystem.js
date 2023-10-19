import { useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';

import { firestore } from '../configs/firebase.config';
import useSystemStore from '../stores/system.store';

const useSystem = () => {
  const setConfigs = useSystemStore((state) => state.setConfigs);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(firestore, 'system', 'default'),
      (snapshot) => {
        if (snapshot.exists()) {
          setConfigs(snapshot.data());
        } else {
          setConfigs(null);
        }
      }
    );

    return unsubscribe;
  }, []);
};

export default useSystem;
