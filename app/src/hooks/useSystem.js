import { useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';

import { firestore } from '../configs/firebase.config';
import useSystemStore from '../stores/system.store';
import useModalStore from '../stores/modal.store';

const useSystem = () => {
  const configs = useSystemStore((state) => state.configs);
  const setConfigs = useSystemStore((state) => state.setConfigs);
  const setActiveSeason = useSystemStore((state) => state.setActiveSeason);
  const setMarket = useSystemStore((state) => state.setMarket);
  const setTemplates = useSystemStore((state) => state.setTemplates);
  const setEstimatedGas = useSystemStore((state) => state.setEstimatedGas);
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
    const unsubscribe = onSnapshot(doc(firestore, 'template', 'twitterShareReferralCode'), (snapshot) => {
      if (snapshot.exists()) {
        console.log('snapshot.data()', snapshot.data());
        setTemplates({ twitterShareReferralCode: snapshot.data().text });
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(firestore, 'system', 'market'), (snapshot) => {
      if (snapshot.exists()) {
        setMarket(snapshot.data());
      } else {
        setMarket(null);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(firestore, 'system', 'estimated-gas'), (snapshot) => {
      if (snapshot.exists()) {
        setEstimatedGas(snapshot.data());
      } else {
        setEstimatedGas(null);
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
