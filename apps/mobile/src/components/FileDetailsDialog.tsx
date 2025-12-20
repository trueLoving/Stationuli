// 文件详情对话框组件 - 从 stationuli-common 重新导出并设置默认 variant
import { FileDetailsDialog as FileDetailsDialogCommon } from "stationuli-common/components/FileDetailsDialog";
import type { ReceivedFile } from "stationuli-common/types";

interface FileDetailsDialogProps {
  isOpen: boolean;
  file: ReceivedFile | null;
  onClose: () => void;
}

export function FileDetailsDialog(props: FileDetailsDialogProps) {
  return <FileDetailsDialogCommon {...props} variant="mobile" />;
}
