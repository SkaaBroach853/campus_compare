"use client";

import { create } from "zustand";

interface SavedStore {
  savedIds: string[];
  toggleSaved: (id: string) => void;
  setSaved: (ids: string[]) => void;
}

export const useSavedStore = create<SavedStore>((set) => ({
  savedIds: [],
  toggleSaved: (id) =>
    set((state) => ({
      savedIds: state.savedIds.includes(id)
        ? state.savedIds.filter((savedId) => savedId !== id)
        : [...state.savedIds, id],
    })),
  setSaved: (ids) => set({ savedIds: ids }),
}));
