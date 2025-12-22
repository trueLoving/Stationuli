// 移动端应用状态管理
import { create } from "zustand";

interface AppState {
  currentPage: "home" | "devices" | "history" | "settings";
  setCurrentPage: (page: "home" | "devices" | "history" | "settings") => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: "home",
  setCurrentPage: (page) => set({ currentPage: page }),
}));
