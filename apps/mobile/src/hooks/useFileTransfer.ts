// 文件传输相关 Hook - 使用 stationuli-common 的 useFileTransfer
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useState } from "react";
import { useFileTransfer as useFileTransferCommon } from "stationuli-common/hooks/useFileTransfer";
import type { FileInfo } from "../api/file";
import { PermissionStatus } from "../api/file";
import {
  fileApiAdapter,
  selectFileAndroid,
  selectFileAndroidV2,
  sendFileStreaming,
} from "../api/fileAdapter";
import { FILE_FILTERS } from "../constants";
import { sendFile } from "../api/file";

export function useFileTransfer() {
  const [selectedFileInfo, setSelectedFileInfo] = useState<FileInfo | null>(
    null
  );
  const [transferProgress, setTransferProgress] = useState<number>(0);

  // 监听传输进度事件
  useEffect(() => {
    const unlistenProgress = listen("transfer-progress", (event) => {
      const data = event.payload as {
        file: string;
        progress: number;
        sent: number;
        total: number;
      };
      setTransferProgress(data.progress);
    });

    const unlistenComplete = listen("transfer-complete", () => {
      setTransferProgress(100);
      setTimeout(() => {
        setTransferProgress(0);
      }, 1000);
    });

    return () => {
      unlistenProgress.then((fn) => fn());
      unlistenComplete.then((fn) => fn());
    };
  }, []);

  // 增强的文件选择函数（优先使用 v2 API）
  const selectFileEnhanced = useCallback(async () => {
    try {
      // 优先使用增强版文件选择器（v2）
      try {
        const fileInfos = await selectFileAndroidV2({
          multiple: false,
        });
        if (fileInfos && fileInfos.length > 0) {
          const fileInfo = fileInfos[0];
          setSelectedFileInfo(fileInfo);
          return {
            uri: fileInfo.uri,
            name: fileInfo.name,
          };
        }
      } catch (error) {
        console.log(
          "Enhanced file picker (v2) not available, falling back:",
          error
        );
      }

      // 回退到旧版本文件选择器
      try {
        const androidSelected = await selectFileAndroid();
        if (androidSelected) {
          // 如果使用旧版本，需要手动获取文件信息
          // 这里返回基本信息，后续可以通过API获取详细信息
          return androidSelected;
        }
      } catch (error) {
        console.log(
          "Android file picker not available, using generic dialog:",
          error
        );
        const { open } = await import("@tauri-apps/plugin-dialog");
        const genericSelected = (await open({
          multiple: false,
          directory: false,
          filters: FILE_FILTERS as any,
        })) as string | null;

        if (genericSelected) {
          return { uri: genericSelected, name: "" };
        }
      }
      return null;
    } catch (error) {
      console.error("Failed to select file:", error);
      return null;
    }
  }, []);

  // 增强的文件发送函数（优先使用流式传输）
  const sendFileEnhanced = useCallback(
    async (targetAddress: string, targetPort: number, filePath?: string) => {
      // 如果传入了文件路径，直接使用旧的 send_file API
      // 这样可以避免需要 FileInfo 的问题
      if (filePath) {
        try {
          setTransferProgress(0);
          await sendFile(filePath, targetAddress, targetPort);
          // 注意：send_file API 内部会发送进度事件，所以不需要额外处理
          // 成功提示会在 commonHook 中处理，或者由 send_file 内部处理
          return;
        } catch (error) {
          console.error("Failed to send file:", error);
          const errorMsg = typeof error === "string" ? error : String(error);
          alert(`❌ 文件发送失败: ${errorMsg}`);
          setTransferProgress(0);
          return;
        }
      }

      // 如果没有传入文件路径，使用状态中的文件信息（流式传输）
      if (!selectedFileInfo) {
        alert("请先选择要发送的文件");
        return;
      }

      // 检查权限状态
      if (selectedFileInfo.permission_status === PermissionStatus.Unknown) {
        const confirmed = confirm("文件权限可能已失效，是否重新选择文件？");
        if (!confirmed) {
          return;
        }
        // 重新选择文件 - 使用增强的文件选择器以获取 FileInfo
        const newFile = await selectFileEnhanced();
        if (!newFile) {
          return;
        }
        // 这里需要重新获取FileInfo，简化处理
        alert("请重新选择文件");
        return;
      }

      try {
        setTransferProgress(0);
        // 使用流式传输（对于大文件更安全）
        await sendFileStreaming(selectedFileInfo, targetAddress, targetPort);
        alert("✅ 文件发送成功");
      } catch (error) {
        console.error("Failed to send file:", error);
        const errorMsg = typeof error === "string" ? error : String(error);
        alert(`❌ 文件发送失败: ${errorMsg}`);
        setTransferProgress(0);
      }
    },
    [selectedFileInfo, selectFileEnhanced]
  );

  // 使用通用的 useFileTransfer Hook，但覆盖关键函数
  const commonHook = useFileTransferCommon({
    fileApi: fileApiAdapter,
  });

  return {
    ...commonHook,
    selectedFileInfo,
    transferProgress,
    setTransferProgress,
    sendFile: sendFileEnhanced,
  };
}
