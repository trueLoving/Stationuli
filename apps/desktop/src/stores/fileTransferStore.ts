// 文件传输全局状态管理
import type { ReceivedFile } from "stationuli-common/types";
import { create } from "zustand";
import { fileApiAdapter } from "../api/fileAdapter";

interface FileTransferState {
  // 状态
  receivedFiles: ReceivedFile[];
  transferProgress: number;

  // 方法
  setReceivedFiles: (files: ReceivedFile[]) => void;
  addReceivedFile: (file: ReceivedFile) => void;
  removeReceivedFile: (file: ReceivedFile) => void;
  setTransferProgress: (progress: number) => void;
  sendFile: (address: string, port: number, filePath: string) => Promise<void>;
  saveReceivedFile: (file: ReceivedFile) => Promise<void>;
}

export const useFileTransferStore = create<FileTransferState>((set, get) => ({
  // 初始状态
  receivedFiles: [],
  transferProgress: 0,

  // Setters
  setReceivedFiles: (files) => set({ receivedFiles: files }),
  setTransferProgress: (progress) => set({ transferProgress: progress }),

  // 添加接收的文件
  addReceivedFile: (file) => {
    const state = get();
    set({ receivedFiles: [...state.receivedFiles, file] });
  },

  // 删除接收的文件
  removeReceivedFile: (file) => {
    const state = get();
    set({
      receivedFiles: state.receivedFiles.filter((f) => f.path !== file.path),
    });
  },

  // 发送文件
  sendFile: async (address, port, filePath) => {
    await fileApiAdapter.sendFile(filePath, address, port);
  },

  // 保存接收的文件
  saveReceivedFile: async (file) => {
    await fileApiAdapter.saveReceivedFile(file.path, file.name);
  },
}));
