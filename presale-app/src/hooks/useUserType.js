import { useEffect, useState } from 'react';
import { onSnapshot, query, collection, where } from 'firebase/firestore';

import { firestore } from '../configs/firebase.config';

const useUserType = (username) => {
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [isFromSeasonOne, setIsFromSeasonOne] = useState(false);

  useEffect(() => {
    let unsubscribe;

    if (username) {
      const q = query(collection(firestore, 'whitelisted'), where('username', '==', username));
      unsubscribe = onSnapshot(q, (snapshot) => {
        setIsWhitelisted(!snapshot.empty);
      });
    } else {
      setIsWhitelisted(false);
    }

    return () => unsubscribe?.();
  }, [username]);

  return { isWhitelisted, isFromSeasonOne };
};

export default useUserType;
