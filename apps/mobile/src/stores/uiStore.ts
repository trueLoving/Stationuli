// UI 全局状态管理（布局相关）
import { create } from "zustand";

interface UiState {
  // 布局相关（移动端暂时不需要，保留接口以便未来扩展）
}

export const useUiStore = create<UiState>(() => ({}));
