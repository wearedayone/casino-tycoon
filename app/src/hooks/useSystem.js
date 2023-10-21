import { useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';

import { firestore } from '../configs/firebase.config';
import useSystemStore from '../stores/system.store';
import useModalStore from '../stores/modal.store';

const useSystem = () => {
  const configs = useSystemStore((state) => state.configs);
  const setConfigs = useSystemStore((state) => state.setConfigs);
  const setOpenUpdate = useModalStore((state) => state.setOpenUpdate);

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

  useEffect(() => {
    if (configs) {
      const { appVersion } = configs;
      const currentAppVersion = localStorage.getItem('appVersion');

      if (currentAppVersion) {
        if (currentAppVersion !== appVersion) {
          setOpenUpdate(true);
        }
      } else {
        localStorage.setItem('appVersion', appVersion);
      }
    }
  }, [configs]);
};

export default useSystem;
