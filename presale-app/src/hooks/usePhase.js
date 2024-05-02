import { useState, useEffect } from 'react';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';

import { firestore } from '../configs/firebase.config';

const getStatus = ({ type, startTime, endTime, isWhitelisted, isFromSeasonOne, logged }) => {
  const now = Date.now();

  let status = ''; // cs | invalid | active | login | end
  if (startTime <= now && now < endTime) {
    status = 'active';
  }

  if ((type === 'whitelisted' && !isWhitelisted) || (type === 'season-1' && !isFromSeasonOne)) {
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

const usePhase = ({ logged, isWhitelisted, isFromSeasonOne }) => {
  const [phases, setPhases] = useState([]);

  useEffect(() => {
    const q = query(collection(firestore, 'phase'), orderBy('startTime', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => {
        const { type } = doc.data();
        const endTime = doc.data().endTime.toDate().getTime();
        let startTime = doc.data().startTime.toDate().getTime();
        if (type === 'season-1-public') {
          if (isFromSeasonOne) {
            startTime = doc.data().startTimeForSeason1Users.toDate().getTime();
          }
        }

        const status = getStatus({
          type,
          startTime,
          endTime,
          isWhitelisted,
          isFromSeasonOne,
          logged,
        });

        return { id: doc.id, ...doc.data(), status, startTime, endTime };
      });

      setPhases(docs);
    });

    return () => unsubscribe?.();
  }, [logged, isWhitelisted, isFromSeasonOne]);

  const updatePhaseStatus = () => {
    const newPhases = phases.map((item) => ({
      ...item,
      status: getStatus({
        type: item.type,
        startTime: item.startTime,
        endTime: item.endTime,
        isWhitelisted,
        isFromSeasonOne,
        logged,
      }),
    }));

    setPhases(newPhases);
  };

  return { phases, updatePhaseStatus };
};

export default usePhase;
