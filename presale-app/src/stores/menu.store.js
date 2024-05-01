import { create } from 'zustand';

const useMenuStore = create((set, get) => ({
  open: false,
  setOpen: (open) => set((state) => ({ open })),
}));

export default useMenuStore;
