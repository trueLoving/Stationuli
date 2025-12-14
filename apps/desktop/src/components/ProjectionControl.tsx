// 投影控制组件

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
    <div className="space-y-2">
      {error && (
        <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleStartProjection}
          disabled={isProjecting}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {isProjecting ? "投影中..." : "开始投影"}
        </button>

        {isProjecting && (
          <button
            onClick={handleStopProjection}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            停止投影
          </button>
        )}

        <button
          onClick={handleStartReceiving}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
        >
          接收投影
        </button>
      </div>
    </div>
  );
}
