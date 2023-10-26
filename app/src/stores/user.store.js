import { create } from 'zustand';

const useUserStore = create((set, get) => ({
  initialized: false,
  profile: null,
  gamePlay: null,
  setInitialized: (newInitialized) => set((state) => ({ initialized: newInitialized })),
  setProfile: (newProfile) => set((state) => ({ profile: newProfile })),
  setGamePlay: (newGamePlay) => set((state) => ({ gamePlay: newGamePlay })),
}));

export default useUserStore;
