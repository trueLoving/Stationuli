// 投影控制组件（移动端）

import { useState } from "react";
import * as projectionApi from "../api/projection";
import type { DeviceInfo } from "../types";
import { ProjectionView } from "./ProjectionView";

interface ProjectionControlProps {
  device: DeviceInfo;
}

export function ProjectionControl({ device }: ProjectionControlProps) {
  const [isProjecting, setIsProjecting] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartProjection = async () => {
    try {
      setError(null);
      await projectionApi.startProjection(device.address, device.port, 10, 75);
      setIsProjecting(true);
    } catch (err) {
      setError(String(err));
      setIsProjecting(false);
    }
  };

  const handleStopProjection = async () => {
    try {
      await projectionApi.stopProjection();
      setIsProjecting(false);
    } catch (err) {
      setError(String(err));
    }
  };

  const handleStartReceiving = () => {
    setIsReceiving(true);
  };

  const handleCloseReceiving = () => {
    setIsReceiving(false);
  };

  if (isReceiving) {
    return <ProjectionView device={device} onClose={handleCloseReceiving} />;
  }

  return (
    <div className="space-y-2 mt-2">
      {error && (
        <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleStartProjection}
          disabled={isProjecting}
          className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-md active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-150 text-xs"
        >
          {isProjecting ? "投影中..." : "开始投影"}
        </button>

        {isProjecting && (
          <button
            onClick={handleStopProjection}
            className="px-3 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all duration-150 text-xs"
          >
            停止
          </button>
        )}

        <button
          onClick={handleStartReceiving}
          className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all duration-150 text-xs"
        >
          接收投影
        </button>
      </div>
    </div>
  );
}
