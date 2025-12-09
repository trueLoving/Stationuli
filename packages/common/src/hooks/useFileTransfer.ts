// 文件传输相关 Hook（通用版本，接受 API 作为参数）

import { useCallback, useState } from "react";
import type { FileApi } from "../api";
import type { ReceivedFile } from "../types";

interface UseFileTransferOptions {
  fileApi: FileApi;
  onSelectFile?: (
    filePath: string
  ) => Promise<{ uri: string; name: string } | null>;
}

export function useFileTransfer({
  fileApi,
  onSelectFile,
}: UseFileTransferOptions) {
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [selectedFileSize, setSelectedFileSize] = useState<number>(0);
  const [transferProgress, setTransferProgress] = useState<number>(0);
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);

  const selectFile = useCallback(async () => {
    try {
      let selectedUri: string | null = null;
      let selectedName: string | null = null;

      // 如果提供了自定义文件选择器（如 Android），先尝试使用
      if (onSelectFile) {
        try {
          const result = await onSelectFile("");
          if (result) {
            selectedUri = result.uri;
            selectedName = result.name;
          }
        } catch (error) {
          console.log(
            "Custom file picker not available, using generic dialog:",
            error
          );
        }
      }

      // 如果没有选择文件，使用通用文件选择器
      if (!selectedUri) {
        const filePath = await fileApi.selectFile();
        if (filePath) {
          selectedUri = filePath;
        }
      }

      if (selectedUri && typeof selectedUri === "string") {
        // 解码 URI
        let decodedPath = selectedUri;
        try {
          decodedPath = decodeURIComponent(selectedUri);
        } catch (e) {
          console.warn("Failed to decode URI, using original:", e);
        }

        setSelectedFile(decodedPath);

        // 如果已经提供了文件名，直接使用
        if (selectedName) {
          setSelectedFileName(selectedName);
        } else {
          // 否则通过 API 获取文件名
          try {
            const fileName = await fileApi.getFileName(decodedPath);
            setSelectedFileName(fileName);
          } catch (error) {
            console.warn("Failed to get file name:", error);
            const fallbackName =
              decodedPath.split("/").pop() ||
              decodedPath.split("\\").pop() ||
              "未知文件";
            setSelectedFileName(fallbackName);
          }
        }

        // 获取文件大小
        try {
          const fileSize = await fileApi.getFileSize(decodedPath);
          setSelectedFileSize(fileSize);
        } catch (error) {
          console.warn("Failed to get file size:", error);
          setSelectedFileSize(0);
        }
      }
    } catch (error) {
      console.error("Failed to select file:", error);
      alert(`选择文件失败: ${error}`);
    }
  }, [fileApi, onSelectFile]);

  const clearSelectedFile = useCallback(() => {
    setSelectedFile("");
    setSelectedFileName("");
    setSelectedFileSize(0);
  }, []);

  const sendFile = useCallback(
    async (targetAddress: string, targetPort: number, filePath?: string) => {
      const fileToSend = filePath || selectedFile;
      if (!fileToSend) {
        alert("请先选择要发送的文件");
        return;
      }

      try {
        setTransferProgress(0);
        await fileApi.sendFile(fileToSend, targetAddress, targetPort);
      } catch (error) {
        console.error("Failed to send file:", error);
        alert(`❌ 文件发送失败: ${error}`);
        setTransferProgress(0);
      }
    },
    [selectedFile, fileApi]
  );

  const saveReceivedFile = useCallback(
    async (file: ReceivedFile) => {
      try {
        const result = await fileApi.saveReceivedFile(file.path, file.name);
        alert(`✅ ${result}`);
      } catch (error) {
        console.error("Failed to save file:", error);
        alert(`❌ 保存文件失败: ${error}`);
      }
    },
    [fileApi]
  );

  const addReceivedFile = useCallback((file: ReceivedFile) => {
    setReceivedFiles((prev) => [file, ...prev]);
  }, []);

  const removeReceivedFile = useCallback((file: ReceivedFile) => {
    setReceivedFiles((prev) =>
      prev.filter((f) => f.path !== file.path || f.name !== file.name)
    );
  }, []);

  return {
    selectedFile,
    selectedFileName,
    selectedFileSize,
    transferProgress,
    receivedFiles,
    setTransferProgress,
    selectFile,
    clearSelectedFile,
    sendFile,
    saveReceivedFile,
    addReceivedFile,
    removeReceivedFile,
  };
}
