// 添加设备对话框组件

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
  variant?: "mobile" | "desktop";
}

export function AddDeviceDialog({
  isOpen,
  deviceAddress,
  devicePort,
  deviceName,
  deviceType,
  deviceId,
  onAddressChange,
  onPortChange,
  onNameChange,
  onTypeChange,
  onIdChange,
  onClose,
  onAdd,
  variant = "mobile",
}: AddDeviceDialogProps) {
  if (!isOpen) return null;

  const isMobile = variant === "mobile";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div
        className={`bg-white rounded-2xl shadow-2xl ${isMobile ? "p-5 w-full max-w-sm my-4" : "p-6 w-full max-w-md mx-4 my-4"}`}
      >
        <h2
          className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-gray-800 ${isMobile ? "mb-5" : "mb-6"} flex items-center gap-2`}
        >
          <span>➕</span>
          添加设备
        </h2>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              设备名称 <span className="text-gray-400">(可选)</span>
            </label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="例如: 我的电脑"
              className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isMobile ? "text-base" : ""}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              设备类型 <span className="text-gray-400">(可选)</span>
            </label>
            <select
              value={deviceType}
              onChange={(e) => onTypeChange(e.target.value)}
              className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${isMobile ? "text-base" : ""}`}
            >
              <option value="unknown">未知</option>
              <option value="desktop">桌面端</option>
              <option value="mobile">移动端</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              设备ID <span className="text-gray-400">(可选)</span>
            </label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => onIdChange(e.target.value)}
              placeholder="例如: device-xxx"
              className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${isMobile ? "text-base" : ""}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IP 地址 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={deviceAddress}
              onChange={(e) => onAddressChange(e.target.value)}
              placeholder="例如: 192.168.1.100"
              className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isMobile ? "text-base" : ""}`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const portInput = document.querySelector<HTMLInputElement>(
                    'input[type="number"]'
                  );
                  if (portInput) {
                    portInput.focus();
                  }
                }
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              端口 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={devicePort}
              onChange={(e) => onPortChange(e.target.value)}
              placeholder="例如: 8080"
              min="1"
              max="65535"
              className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isMobile ? "text-base" : ""}`}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAdd();
                }
              }}
            />
          </div>
        </div>

        <div className={`flex gap-3 ${isMobile ? "mt-6" : "mt-6"}`}>
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors ${isMobile ? "active:scale-95" : ""}`}
          >
            取消
          </button>
          <button
            onClick={onAdd}
            className={`flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all ${isMobile ? "active:scale-95" : ""}`}
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
}
