import { create } from 'zustand';

const useSettingStore = create((set, get) => ({
  sound: 'on',
  toggleSound: () => set((state) => ({ sound: state.sound === 'on' ? 'off' : 'on' })),
}));

export default useSettingStore;
