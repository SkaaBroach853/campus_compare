"use client";

import { create } from "zustand";
import type { College } from "@/types";

interface CompareStore {
  compareList: College[];
  addToCompare: (college: College) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
}

export const useCompareStore = create<CompareStore>((set) => ({
  compareList: [],
  addToCompare: (college) =>
    set((state) => {
      const alreadySelected = state.compareList.some((item) => item.id === college.id);

      if (alreadySelected || state.compareList.length >= 3) {
        return state;
      }

      return { compareList: [...state.compareList, college] };
    }),
  removeFromCompare: (id) =>
    set((state) => ({
      compareList: state.compareList.filter((college) => college.id !== id),
    })),
  clearCompare: () => set({ compareList: [] }),
}));
