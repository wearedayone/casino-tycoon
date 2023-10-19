import { create } from 'zustand';

const useSystemStore = create((set, get) => ({
  configs: null,
  setConfigs: (newConfigs) => set((state) => ({ configs: newConfigs })),
}));

export default useSystemStore;
