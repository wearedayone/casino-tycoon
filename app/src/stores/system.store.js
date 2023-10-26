import { create } from 'zustand';

const useSystemStore = create((set, get) => ({
  configs: null,
  activeSeason: null,
  setConfigs: (newConfigs) => set((state) => ({ configs: newConfigs })),
  setActiveSeason: (newActiveSeason) => set((state) => ({ activeSeason: newActiveSeason })),
}));

export default useSystemStore;
