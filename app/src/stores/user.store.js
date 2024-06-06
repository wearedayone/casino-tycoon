import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import * as Sentry from '@sentry/react';

import { firestore } from '../configs/firebase.config';
import { getUserWarDeployment } from '../services/gamePlay.service';

const useUserStore = create((set, get) => ({
  initialized: false,
  profile: null,
  gamePlay: null,
  claimable: false,
  setInitialized: (newInitialized) => set((state) => ({ initialized: newInitialized })),
  setProfile: (newProfile) => set((state) => ({ profile: newProfile })),
  setGamePlay: (newGamePlay) => set((state) => ({ gamePlay: newGamePlay })),
  setClaimable: (newClaimable) => set((state) => ({ claimable: newClaimable })),
  reloadWarDeployment: async () => {
    try {
      const res = await getUserWarDeployment();
      const warDeployment = res.data;
      if (warDeployment?.attackUserId) {
        const attackUserDoc = doc(firestore, 'user', res.data.attackUserId);
        const attackUserSnapshot = await getDoc(attackUserDoc);
        warDeployment.attackUser = {
          id: warDeployment.attackUserId,
          username: attackUserSnapshot.data().username,
        };
      }

      const gamePlay = get().gamePlay;
      set({ gamePlay: { ...gamePlay, warDeployment } });
    } catch (err) {
      console.error(err);
      Sentry.captureException(err);
    }
  },
}));

export default useUserStore;
