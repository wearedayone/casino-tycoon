import { useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';

import { firestore } from '../configs/firebase.config';
import useUserStore from '../stores/user.store';

const useUserProfile = (userId) => {
  const setInitialized = useUserStore((state) => state.setInitialized);
  const setProfile = useUserStore((state) => state.setProfile);

  useEffect(() => {
    let unsubscribe;
    if (userId) {
      unsubscribe = onSnapshot(doc(firestore, 'user', userId), (snapshot) => {
        if (snapshot.exists()) {
          setProfile({ id: snapshot.id, ...snapshot.data() });
          setInitialized(true);
        } else {
          setProfile(null);
          setInitialized(true);
        }
      });
    } else {
      setProfile(null);
      setInitialized(true);
    }

    return () => unsubscribe?.();
  }, [userId]);
};

export default useUserProfile;
