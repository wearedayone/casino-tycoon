import { useState, useEffect } from 'react';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';

import { firestore } from '../configs/firebase.config';

const getStatus = ({ phaseId, type, startTime, endTime, whitelistedPhaseIds, logged, sold, totalSupply }) => {
  if (sold >= totalSupply) return 'end';
  const now = Date.now();

  let status = ''; // cs | invalid | active | login | end
  if (startTime <= now && now < endTime) {
    status = 'active';
  }

  if (type === 'whitelisted' && !whitelistedPhaseIds.includes(`${phaseId}`)) {
    status = 'invalid';
  }

  if (!logged) {
    status = 'login';
  }

  if (now >= endTime) {
    status = 'end';
  }

  if (now < startTime) {
    status = 'cs';
  }

  return status;
};

const usePhase = ({ logged, whitelistedPhaseIds }) => {
  const [phases, setPhases] = useState([]);

  useEffect(() => {
    const q = query(collection(firestore, 'phase'), orderBy('startTime', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => {
        const { type, sold, totalSupply } = doc.data();
        const endTime = doc.data().endTime.toDate().getTime();
        let startTime = doc.data().startTime.toDate().getTime();
        if (type === 'hybrid') {
          if (whitelistedPhaseIds.includes(`${doc.id}`)) {
            startTime = doc.data().startTimeForWhitelisted.toDate().getTime();
          }
        }

        const status = getStatus({
          phaseId: doc.id,
          type,
          startTime,
          endTime,
          whitelistedPhaseIds,
          logged,
          sold,
          totalSupply,
        });

        return { id: doc.id, ...doc.data(), status, startTime, endTime };
      });

      setPhases(docs);
    });

    return () => unsubscribe?.();
  }, [logged, whitelistedPhaseIds]);

  const updatePhaseStatus = () => {
    const newPhases = phases.map((item) => ({
      ...item,
      status: getStatus({
        phaseId: item.id,
        type: item.type,
        startTime: item.startTime,
        endTime: item.endTime,
        whitelistedPhaseIds,
        logged,
        sold: item.sold,
        totalSupply: item.totalSupply,
      }),
    }));

    setPhases(newPhases);
  };

  console.log({ phases });

  return { phases, updatePhaseStatus };
};

export default usePhase;
