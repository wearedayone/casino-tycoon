import { useState, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';

import { firestore } from '../configs/firebase.config';
import useUserStore from '../stores/user.store';

const useAuth = () => {
  const [userId, setUserId] = useState(null);
  const setInitialized = useUserStore((state) => state.setInitialized);
  const setUser = useUserStore((state) => state.setUser);

  // TODO: now use for testing, rm and use privy.io api later
  useEffect(() => {
    if (!window.setUserId) {
      window.setUserId = setUserId;
    }
  }, []);

  useEffect(() => {
    let unsubscribe;
    if (userId) {
      unsubscribe = onSnapshot(doc(firestore, 'user', userId), (snapshot) => {
        if (snapshot.exists()) {
          setUser({ id: snapshot.id, ...snapshot.data() });
          setInitialized(true);
        } else {
          setUser(null);
          setInitialized(true);
        }
      });
    } else {
      setUser(null);
      setInitialized(true);
    }

    return () => unsubscribe?.();
  }, [userId]);
};

export default useAuth;
