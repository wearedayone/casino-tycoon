import { useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';

import { firestore } from '../configs/firebase.config';
import useSystemStore from '../stores/system.store';
import useModalStore from '../stores/modal.store';

const useSystem = () => {
  const configs = useSystemStore((state) => state.configs);
  const setConfigs = useSystemStore((state) => state.setConfigs);
  const setActiveSeason = useSystemStore((state) => state.setActiveSeason);
  const setOpenUpdate = useModalStore((state) => state.setOpenUpdate);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(firestore, 'system', 'default'), (snapshot) => {
      if (snapshot.exists()) {
        setConfigs(snapshot.data());
      } else {
        setConfigs(null);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let unsubscribe;
    if (configs) {
      unsubscribe = onSnapshot(doc(firestore, 'season', configs.activeSeasonId), (snapshot) => {
        if (snapshot.exists()) {
          setActiveSeason({ id: snapshot.id, ...snapshot.data() });
        } else {
          setActiveSeason(null);
        }
      });
    }

    return () => unsubscribe?.();
  }, [configs]);

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
