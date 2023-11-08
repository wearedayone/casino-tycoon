import { create } from 'zustand';

const useUserStore = create((set, get) => ({
  initialized: false,
  profile: null,
  gamePlay: null,
  claimable: false,
  setInitialized: (newInitialized) => set((state) => ({ initialized: newInitialized })),
  setProfile: (newProfile) => set((state) => ({ profile: newProfile })),
  setGamePlay: (newGamePlay) => set((state) => ({ gamePlay: newGamePlay })),
  setClaimable: (newClaimable) => set((state) => ({ claimable: newClaimable })),
}));

export default useUserStore;
