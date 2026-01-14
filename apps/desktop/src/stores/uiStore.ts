// UI 全局状态管理（对话框、工作台等）
import type { ReceivedFile } from "stationuli-common/types";
import { create } from "zustand";
import type { DeviceInfo } from "../types";

interface UiState {
  // 工作台
  workspaceDevice: DeviceInfo | null;
  setWorkspaceDevice: (device: DeviceInfo | null) => void;

  // 文件详情对话框
  showFileDetailsDialog: boolean;
  selectedFile: ReceivedFile | null;
  openFileDetailsDialog: (file: ReceivedFile) => void;
  closeFileDetailsDialog: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  // 工作台
  workspaceDevice: null,
  setWorkspaceDevice: (device) => set({ workspaceDevice: device }),

  // 文件详情对话框
  showFileDetailsDialog: false,
  selectedFile: null,
  openFileDetailsDialog: (file) =>
    set({ showFileDetailsDialog: true, selectedFile: file }),
  closeFileDetailsDialog: () =>
    set({ showFileDetailsDialog: false, selectedFile: null }),
}));
