import { create } from "zustand";
import type { TransferInfo, TransferStatus } from "../types";

interface TransferState {
  transfers: TransferInfo[];
  addTransfer: (transfer: TransferInfo) => void;
  updateTransfer: (transferId: string, updates: Partial<TransferInfo>) => void;
  removeTransfer: (transferId: string) => void;
  getTransfer: (transferId: string) => TransferInfo | undefined;
  clearTransfers: () => void;
}

/**
 * 传输状态管理 Store
 */
export const useTransferStore = create<TransferState>((set) => ({
  transfers: [],

  addTransfer: (transfer) =>
    set((state) => ({
      transfers: [...state.transfers, transfer],
    })),

  updateTransfer: (transferId, updates) =>
    set((state) => ({
      transfers: state.transfers.map((t) =>
        t.id === transferId ? { ...t, ...updates } : t
      ),
    })),

  removeTransfer: (transferId) =>
    set((state) => ({
      transfers: state.transfers.filter((t) => t.id !== transferId),
    })),

  getTransfer: (transferId) => {
    const state = useTransferStore.getState();
    return state.transfers.find((t) => t.id === transferId);
  },

  clearTransfers: () => set({ transfers: [] }),
}));
