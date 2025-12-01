// 添加设备对话框组件

interface AddDeviceDialogProps {
  isOpen: boolean;
  deviceAddress: string;
  devicePort: string;
  onAddressChange: (address: string) => void;
  onPortChange: (port: string) => void;
  onClose: () => void;
  onAdd: () => void;
  variant?: "mobile" | "desktop";
}

export function AddDeviceDialog({
  isOpen,
  deviceAddress,
  devicePort,
  onAddressChange,
  onPortChange,
  onClose,
  onAdd,
  variant = "mobile",
}: AddDeviceDialogProps) {
  if (!isOpen) return null;

  const isMobile = variant === "mobile";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl ${isMobile ? "p-5 w-full max-w-sm" : "p-6 w-full max-w-md mx-4"}`}
      >
        <h2
          className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-gray-800 ${isMobile ? "mb-5" : "mb-6"} flex items-center gap-2`}
        >
          <span>➕</span>
          添加设备
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IP 地址
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
              端口
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
