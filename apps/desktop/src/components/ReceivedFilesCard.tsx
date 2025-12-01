// 接收的文件卡片组件 - 从 stationuli-common 重新导出并设置默认 variant
import { ReceivedFilesCard as ReceivedFilesCardCommon } from "stationuli-common/components/ReceivedFilesCard";
import type { ReceivedFile } from "../types";

interface ReceivedFilesCardProps {
  receivedFiles: ReceivedFile[];
  onSave: (file: ReceivedFile) => void;
}

export function ReceivedFilesCard(props: ReceivedFilesCardProps) {
  const handleOpenLocation = async (file: ReceivedFile) => {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    const parentDir = file.path.split("/").slice(0, -1).join("/");
    await openUrl(parentDir);
  };

  return (
    <ReceivedFilesCardCommon
      {...props}
      onOpenLocation={handleOpenLocation}
      variant="desktop"
    />
  );
}
