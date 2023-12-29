import { create } from 'zustand';

const useSystemStore = create((set, get) => ({
  configs: null,
  activeSeason: null,
  market: null,
  estimatedGas: null,
  setConfigs: (newConfigs) => set((state) => ({ configs: newConfigs })),
  setActiveSeason: (newActiveSeason) => set((state) => ({ activeSeason: newActiveSeason })),
  setMarket: (newMarket) => set((state) => ({ market: newMarket })),
  setEstimatedGas: (newEstimatedGas) => set((state) => ({ estimatedGas: newEstimatedGas })),
}));

export default useSystemStore;
