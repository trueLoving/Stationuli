// 添加设备对话框组件 - 从 stationuli-common 重新导出并设置默认 variant
import { AddDeviceDialog as AddDeviceDialogCommon } from "stationuli-common/components/AddDeviceDialog";

interface AddDeviceDialogProps {
  isOpen: boolean;
  deviceAddress: string;
  devicePort: string;
  onAddressChange: (address: string) => void;
  onPortChange: (port: string) => void;
  onClose: () => void;
  onAdd: () => void;
}

export function AddDeviceDialog(props: AddDeviceDialogProps) {
  return <AddDeviceDialogCommon {...props} variant="desktop" />;
}
