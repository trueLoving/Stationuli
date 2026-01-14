// 应用状态管理 Store（UI 相关）
import { create } from "zustand";

interface AppState {
  sidebarCollapsed: boolean; // 侧边栏是否折叠
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
