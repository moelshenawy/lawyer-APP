import { create } from "zustand";

// Simple global store example with a numeric value and helpers.
const useExampleStore = create((set) => ({
  value: 0,
  increase: () =>
    set((state) => ({
      value: state.value + 1,
    })),
  decrease: () =>
    set((state) => ({
      value: state.value - 1,
    })),
}));

export default useExampleStore;
