import { create } from 'zustand';

const useSpinStore = create((set, get) => ({
  initialized: false,
  spinned: false,
  setInitialized: (newInitialized) => set((state) => ({ initialized: newInitialized })),
  setSpinned: (newSpinned) => set((state) => ({ spinned: newSpinned })),
}));

export default useSpinStore;
