// 添加设备对话框组件 - 从 stationuli-common 重新导出并设置默认 variant
import { AddDeviceDialog as AddDeviceDialogCommon } from "stationuli-common/components/AddDeviceDialog";

interface AddDeviceDialogProps {
  isOpen: boolean;
  deviceAddress: string;
  devicePort: string;
  deviceName: string;
  deviceType: string;
  deviceId: string;
  onAddressChange: (address: string) => void;
  onPortChange: (port: string) => void;
  onNameChange: (name: string) => void;
  onTypeChange: (type: string) => void;
  onIdChange: (id: string) => void;
  onClose: () => void;
  onAdd: () => void;
}

export function AddDeviceDialog(props: AddDeviceDialogProps) {
  return <AddDeviceDialogCommon {...props} variant="mobile" />;
}
