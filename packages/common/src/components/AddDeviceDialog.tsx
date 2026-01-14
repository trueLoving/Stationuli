// 添加设备对话框组件

import { Lightbulb, Plus } from "lucide-react";
import { useEffect, useState } from "react";

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
  onIdChange?: (id: string) => void; // 可选，目前未使用
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
  onIdChange: _onIdChange,
  onClose,
  onAdd,
  variant = "mobile",
}: AddDeviceDialogProps) {
  if (!isOpen) return null;

  const isMobile = variant === "mobile";
  const isEditMode = !!deviceId;

  // 合并的 IP:端口 输入框状态（桌面端和移动端统一使用）
  const [combinedAddress, setCombinedAddress] = useState("");

  // 当 deviceAddress 或 devicePort 变化时，更新合并的值
  useEffect(() => {
    if (deviceAddress && devicePort) {
      setCombinedAddress(`${deviceAddress}:${devicePort}`);
    } else if (deviceAddress) {
      setCombinedAddress(deviceAddress);
    } else {
      setCombinedAddress("");
    }
  }, [deviceAddress, devicePort]);

  // 处理合并输入框的变化
  const handleCombinedAddressChange = (value: string) => {
    setCombinedAddress(value);
    // 解析 IP:端口 格式
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      // 清空时，清空地址和端口
      onAddressChange("");
      onPortChange("");
      return;
    }

    const parts = trimmedValue.split(":");
    if (parts.length === 2) {
      const [address, port] = parts;
      const trimmedAddress = address.trim();
      const trimmedPort = port.trim();
      onAddressChange(trimmedAddress);
      if (trimmedPort) {
        onPortChange(trimmedPort);
      } else {
        // 如果端口为空，保持原有端口或使用默认值
        if (!devicePort) {
          onPortChange("8080");
        }
      }
    } else if (parts.length === 1) {
      // 只有 IP 地址，没有端口
      const trimmedAddress = parts[0].trim();
      onAddressChange(trimmedAddress);
      // 如果没有端口，使用默认端口 8080
      if (!devicePort) {
        onPortChange("8080");
      }
    } else {
      // 多个冒号，可能是无效格式，但先尝试解析第一个部分作为 IP
      const trimmedAddress = parts[0].trim();
      onAddressChange(trimmedAddress);
      if (parts[parts.length - 1].trim()) {
        onPortChange(parts[parts.length - 1].trim());
      } else if (!devicePort) {
        onPortChange("8080");
      }
    }
  };

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

          {/* 统一使用合并的 IP:端口 输入框（桌面端和移动端） */}
          <div>
            <label
              className={`block ${isMobile ? "text-sm" : "text-sm"} font-medium text-gray-700 ${isMobile ? "mb-2" : "mb-2.5"}`}
            >
              IP 地址和端口 <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={combinedAddress}
              onChange={(e) => handleCombinedAddressChange(e.target.value)}
              placeholder="例如: 192.168.1.100:8080"
              className={`w-full ${isMobile ? "px-4 py-3" : "px-4 py-3"} border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${isMobile ? "text-base" : "text-base"} hover:border-gray-400 font-mono`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAdd();
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
                格式：IP地址:端口，例如{" "}
                <code className="px-1 py-0.5 bg-gray-100 rounded text-gray-700 font-mono">
                  192.168.1.100:8080
                </code>{" "}
                或{" "}
                <code className="px-1 py-0.5 bg-gray-100 rounded text-gray-700 font-mono">
                  127.0.0.1:8080
                </code>
              </span>
            </div>
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
            {isEditMode ? "保存" : "添加"}
          </button>
        </div>
      </div>
    </div>
  );
}
