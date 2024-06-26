import { create } from 'zustand';

const useSettingStore = create((set, get) => ({
  sound: localStorage.getItem('sound') || 'on',
  toggleSound: () => {
    const sound = get().sound === 'on' ? 'off' : 'on';
    localStorage.setItem('sound', sound);
    set({ sound });
  },
  onlineListener: false,
  setOnlineListener: (newOnlineListener) => set({ onlineListener: newOnlineListener }),
}));

export default useSettingStore;
