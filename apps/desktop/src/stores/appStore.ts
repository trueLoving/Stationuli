// 应用状态管理 Store
import { create } from "zustand";

interface AppState {
  currentPage: "home" | "devices" | "history" | "settings";
  setCurrentPage: (page: AppState["currentPage"]) => void;
  workspaceDevice: string | null; // 当前打开工作台的设备 ID
  setWorkspaceDevice: (deviceId: string | null) => void;
  sidebarCollapsed: boolean; // 侧边栏是否折叠
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: "home",
  setCurrentPage: (page) => set({ currentPage: page }),
  workspaceDevice: null,
  setWorkspaceDevice: (deviceId) => set({ workspaceDevice: deviceId }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
