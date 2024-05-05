import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import { firestore, auth } from '../configs/firebase.config';

const useUser = () => {
  const [initialized, setInitialized] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({ ...(user || {}), id: firebaseUser?.uid });
      } else {
        setUser(null);
      }
      setInitialized(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let unsubscribe;

    if (user?.id) {
      unsubscribe = onSnapshot(doc(firestore, 'user', user?.id), (snapshot) => {
        if (snapshot.exists()) {
          const user = {
            id: snapshot.id,
            ...snapshot.data(),
          };
          setUser(user);
        } else {
          setUser(null);
        }
      });
    } else {
      setUser(null);
    }

    return () => unsubscribe?.();
  }, [user?.id]);

  return { initialized, user };
};

export default useUser;
