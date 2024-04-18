import { create } from 'zustand';

const usePrivyStore = create((set, get) => ({
  isCustomContainer: true,
  setIsCustomContainer: (isCustomContainer) => set((state) => ({ isCustomContainer })),
}));

export default usePrivyStore;
