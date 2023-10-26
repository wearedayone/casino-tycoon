import { useEffect } from 'react';
import { onSnapshot, query, where, collection } from 'firebase/firestore';

import { firestore } from '../configs/firebase.config';
import useSystemStore from '../stores/system.store';
import useUserStore from '../stores/user.store';

const useUserGamePlay = () => {
  const userId = useUserStore((state) => state.profile?.id);
  const setGamePlay = useUserStore((state) => state.setGamePlay);
  const configs = useSystemStore((state) => state.configs);
  const { activeSeasonId } = configs || {};

  useEffect(() => {
    let unsubscribe;
    if (userId && activeSeasonId) {
      const q = query(
        collection(firestore, 'gamePlay'),
        where('seasonId', '==', activeSeasonId),
        where('userId', '==', userId)
      );
      unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          setGamePlay({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        } else {
          setGamePlay(null);
        }
      });
    } else {
      setGamePlay(null);
    }

    return () => unsubscribe?.();
  }, [userId, activeSeasonId]);
};

export default useUserGamePlay;
