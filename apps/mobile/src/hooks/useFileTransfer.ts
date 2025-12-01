// 文件传输相关 Hook - 使用 stationuli-common 的 useFileTransfer

import { useFileTransfer as useFileTransferCommon } from "stationuli-common/hooks/useFileTransfer";
import { fileApiAdapter, selectFileAndroid } from "../api/fileAdapter";

export function useFileTransfer() {
  return useFileTransferCommon({
    fileApi: fileApiAdapter,
    onSelectFile: async () => {
      try {
        // 尝试使用 Android 专用文件选择器
        const androidSelected = await selectFileAndroid();
        if (androidSelected) {
          return androidSelected;
        }
      } catch (error) {
        // 如果 Android 专用选择器失败，回退到通用对话框
        console.log(
          "Android file picker not available, using generic dialog:",
          error
        );
        const { open } = await import("@tauri-apps/plugin-dialog");
        const { FILE_FILTERS } = await import("../constants");
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
    },
  });
}
