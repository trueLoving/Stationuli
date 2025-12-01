// 文件选择卡片组件 - 从 stationuli-common 重新导出并设置默认 variant
import { FileSelectionCard as FileSelectionCardCommon } from "stationuli-common/components/FileSelectionCard";

interface FileSelectionCardProps {
  selectedFile: string;
  selectedFileName: string;
  selectedFileSize: number;
  transferProgress: number;
  onSelectFile: () => void;
  onClearFile: () => void;
}

export function FileSelectionCard(props: FileSelectionCardProps) {
  return <FileSelectionCardCommon {...props} variant="mobile" />;
}
