import { create } from 'zustand';

const useSystemStore = create((set, get) => ({
  configs: null,
  activeSeason: null,
  market: null,
  setConfigs: (newConfigs) => set((state) => ({ configs: newConfigs })),
  setActiveSeason: (newActiveSeason) => set((state) => ({ activeSeason: newActiveSeason })),
  setMarket: (newMarket) => set((state) => ({ market: newMarket })),
}));

export default useSystemStore;
