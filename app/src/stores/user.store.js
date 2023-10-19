import { create } from 'zustand';

const calculateTotalDailyReward = (machines, workers) => {
  const totalDailyRewardFromMachines = machines.reduce(
    (total, machine) => total + machine.dailyReward,
    0
  );
  const totalDailyRewardFromWorkers = workers.reduce(
    (total, worker) => total + worker.dailyReward,
    0
  );

  return totalDailyRewardFromMachines + totalDailyRewardFromWorkers;
};

const useUserStore = create((set, get) => ({
  initialized: false,
  profile: null,
  gamePlay: null,
  machines: [],
  workers: [],
  buildings: [],
  totalDailyReward: () =>
    calculateTotalDailyReward(get().machines, get().workers),
  setInitialized: (newInitialized) =>
    set((state) => ({ initialized: newInitialized })),
  setProfile: (newProfile) => set((state) => ({ profile: newProfile })),
  setGamePlay: (newGamePlay) => set((state) => ({ gamePlay: newGamePlay })),
  setMachines: (newMachines) => set((state) => ({ machines: newMachines })),
  setWorkers: (newWorkers) => set((state) => ({ workers: newWorkers })),
  setBuildings: (newBuildings) => set((state) => ({ buildings: newBuildings })),
}));

export default useUserStore;
