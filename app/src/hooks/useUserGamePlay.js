import { useState, useEffect } from 'react';
import { onSnapshot, query, where, collection, getDoc, doc } from 'firebase/firestore';

import { firestore } from '../configs/firebase.config';
import useSystemStore from '../stores/system.store';
import useUserStore from '../stores/user.store';

const useUserGamePlay = () => {
  const [usernames, setUsernames] = useState({});
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
      unsubscribe = onSnapshot(q, async (snapshot) => {
        if (!snapshot.empty) {
          const warDeployment = snapshot.docs[0].data().warDeployment;
          if (warDeployment.attackUserId) {
            if (usernames[warDeployment.attackUserId]) {
              warDeployment.attackUser = {
                id: warDeployment.attackUserId,
                username: usernames[warDeployment.attackUserId],
              };
            } else {
              const attackUserDoc = doc(firestore, 'user', warDeployment.attackUserId);
              const attackUserSnapshot = await getDoc(attackUserDoc);
              if (attackUserSnapshot.exists()) {
                setUsernames({ ...usernames, [warDeployment.attackUserId]: attackUserSnapshot.data().username });
                warDeployment.attackUser = {
                  id: warDeployment.attackUserId,
                  username: attackUserSnapshot.data().username,
                };
              }
            }
          }
          setGamePlay({ id: snapshot.docs[0].id, ...snapshot.docs[0].data(), warDeployment });
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
