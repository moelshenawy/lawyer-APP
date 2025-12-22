import { create } from "zustand";

// Global AI chat visibility so components can open/close the widget.
const useChatStore = create((set) => ({
  isOpen: false,
  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
}));

export default useChatStore;
