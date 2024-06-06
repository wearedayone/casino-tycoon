import { create } from 'zustand';

const useModalStore = create((set, get) => ({
  openUpdate: false,
  setOpenUpdate: (open) => set((state) => ({ openUpdate: open })),
  openSetWalletPassword: false,
  setOpenSetWalletPassword: (open) => set((state) => ({ openSetWalletPassword: open })),
}));

export default useModalStore;
