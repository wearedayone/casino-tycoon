import { create } from 'zustand';

const useUserStore = create((set, get) => ({
  initialized: false,
  user: null,
  setInitialized: (newInitialized) =>
    set((state) => ({ initialized: newInitialized })),
  setUser: (newUser) => set((state) => ({ user: newUser })),
}));

export default useUserStore;
