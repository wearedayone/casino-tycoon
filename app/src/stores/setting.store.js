import { create } from 'zustand';

const useSettingStore = create((set, get) => ({
  sound: 'on',
  setSound: (status) => set((state) => ({ sound: status })),
}));

export default useSettingStore;
