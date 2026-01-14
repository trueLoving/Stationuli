// UI 全局状态管理（布局相关）
import { create } from "zustand";

interface UiState {
  // 布局相关
  sidebarCollapsed: boolean; // 侧边栏是否折叠
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  // 布局相关
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
