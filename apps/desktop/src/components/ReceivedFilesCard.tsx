// 接收的文件卡片组件 - 从 stationuli-common 重新导出并设置默认 variant
import { ReceivedFilesCard as ReceivedFilesCardCommon } from "stationuli-common/components/ReceivedFilesCard";
import type { ReceivedFile } from "../types";

interface ReceivedFilesCardProps {
  receivedFiles: ReceivedFile[];
  onSave: (file: ReceivedFile) => void;
  onDelete?: (file: ReceivedFile) => void;
}

export function ReceivedFilesCard(props: ReceivedFilesCardProps) {
  return <ReceivedFilesCardCommon {...props} variant="desktop" />;
}
