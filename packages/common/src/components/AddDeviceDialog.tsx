// 添加设备对话框组件

import { Lightbulb, Plus } from "lucide-react";

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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl ${isMobile ? "p-5 w-full max-w-sm my-4" : "p-8 w-full max-w-lg mx-4 my-4"} transition-all duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-gray-800 ${isMobile ? "mb-5" : "mb-8"} flex items-center gap-3`}
        >
          <div
            className={`${isMobile ? "w-8 h-8" : "w-10 h-10"} bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md`}
          >
            <Plus
              className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-white`}
              aria-hidden="true"
            />
          </div>
          添加设备
        </h2>

        <div
          className={`${isMobile ? "space-y-4" : "space-y-5"} max-h-[70vh] overflow-y-auto`}
        >
          <div>
            <label
              className={`block ${isMobile ? "text-sm" : "text-sm"} font-medium text-gray-700 ${isMobile ? "mb-2" : "mb-2.5"}`}
            >
              设备名称 <span className="text-gray-400 font-normal">(可选)</span>
            </label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="例如: 我的电脑"
              className={`w-full ${isMobile ? "px-4 py-3" : "px-4 py-3"} border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${isMobile ? "text-base" : "text-base"} hover:border-gray-400`}
            />
          </div>

          <div>
            <label
              className={`block ${isMobile ? "text-sm" : "text-sm"} font-medium text-gray-700 ${isMobile ? "mb-2" : "mb-2.5"}`}
            >
              设备类型 <span className="text-gray-400 font-normal">(可选)</span>
            </label>
            <div className="relative">
              <select
                value={deviceType}
                onChange={(e) => onTypeChange(e.target.value)}
                className={`w-full ${isMobile ? "px-4 py-3" : "px-4 py-3"} border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none cursor-pointer transition-all ${isMobile ? "text-base" : "text-base"} hover:border-gray-400 pr-10`}
              >
                <option value="unknown">未知</option>
                <option value="desktop">桌面端</option>
                <option value="mobile">移动端</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label
              className={`block ${isMobile ? "text-sm" : "text-sm"} font-medium text-gray-700 ${isMobile ? "mb-2" : "mb-2.5"}`}
            >
              设备ID <span className="text-gray-400 font-normal">(可选)</span>
            </label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => onIdChange(e.target.value)}
              placeholder="例如: device-xxx"
              className={`w-full ${isMobile ? "px-4 py-3" : "px-4 py-3"} border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono ${isMobile ? "text-sm" : "text-sm"} hover:border-gray-400`}
            />
          </div>

          <div>
            <label
              className={`block ${isMobile ? "text-sm" : "text-sm"} font-medium text-gray-700 ${isMobile ? "mb-2" : "mb-2.5"}`}
            >
              IP 地址 <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={deviceAddress}
              onChange={(e) => onAddressChange(e.target.value)}
              placeholder="例如: 192.168.1.100"
              className={`w-full ${isMobile ? "px-4 py-3" : "px-4 py-3"} border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${isMobile ? "text-base" : "text-base"} hover:border-gray-400`}
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
            <div
              className={`mt-2 flex items-start gap-2 text-xs text-gray-500 ${isMobile ? "mt-1.5" : "mt-2"}`}
            >
              <Lightbulb
                className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500"
                aria-hidden="true"
              />
              <span>
                如果是本地设备，可以使用{" "}
                <code className="px-1 py-0.5 bg-gray-100 rounded text-gray-700 font-mono">
                  127.0.0.1
                </code>
              </span>
            </div>
          </div>

          <div>
            <label
              className={`block ${isMobile ? "text-sm" : "text-sm"} font-medium text-gray-700 ${isMobile ? "mb-2" : "mb-2.5"}`}
            >
              端口 <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="number"
              value={devicePort}
              onChange={(e) => onPortChange(e.target.value)}
              placeholder="例如: 8080"
              min="1"
              max="65535"
              className={`w-full ${isMobile ? "px-4 py-3" : "px-4 py-3"} border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${isMobile ? "text-base" : "text-base"} hover:border-gray-400`}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAdd();
                }
              }}
            />
          </div>
        </div>

        <div className={`flex gap-3 ${isMobile ? "mt-6" : "mt-8"}`}>
          <button
            onClick={onClose}
            className={`flex-1 ${isMobile ? "px-4 py-3" : "px-6 py-3"} bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 active:bg-gray-300 transition-all duration-200 ${isMobile ? "active:scale-95" : "hover:shadow-md"} ${!isMobile ? "transform hover:scale-[1.02]" : ""}`}
          >
            取消
          </button>
          <button
            onClick={onAdd}
            className={`flex-1 ${isMobile ? "px-4 py-3" : "px-6 py-3"} bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg active:shadow-md transition-all duration-200 ${isMobile ? "active:scale-95" : "transform hover:scale-[1.02]"} ${!isMobile ? "hover:from-green-600 hover:to-emerald-700" : ""}`}
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
}
