// 文件卡片组件 - 从 stationuli-common 重新导出并设置默认 variant
import { FileCard as FileCardCommon } from "stationuli-common/components/FileCard";
import type { ReceivedFile } from "../types";

interface FileCardProps {
  file: ReceivedFile;
  onSave: (file: ReceivedFile) => void;
}

export function FileCard(props: FileCardProps) {
  return <FileCardCommon {...props} variant="mobile" />;
}
