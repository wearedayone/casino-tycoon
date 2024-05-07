import { useEffect, useState } from 'react';
import { onSnapshot, query, collection, where } from 'firebase/firestore';

import { firestore } from '../configs/firebase.config';

const useWhitelistedPhaseIds = (username) => {
  const [whitelistedPhaseIds, setWhitelistedPhaseIds] = useState([]);

  useEffect(() => {
    let unsubscribe;

    if (username) {
      const q = query(collection(firestore, 'whitelisted-user'), where('username', '==', username));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const phaseIds = snapshot.docs.map((item) => item.data().phaseId);
        setWhitelistedPhaseIds(phaseIds);
      });
    } else {
      setWhitelistedPhaseIds([]);
    }

    return () => unsubscribe?.();
  }, [username]);

  console.log({ whitelistedPhaseIds });

  return { whitelistedPhaseIds };
};

export default useWhitelistedPhaseIds;
