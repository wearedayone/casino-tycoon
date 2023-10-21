import { create } from 'zustand';

const useModalStore = create((set, get) => ({
  openUpdate: null,
  setOpenUpdate: (open) => set((state) => ({ openUpdate: open })),
}));

export default useModalStore;
