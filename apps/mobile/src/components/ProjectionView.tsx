// 投影视图组件（移动端）

import { useEffect, useRef, useState } from "react";
import * as projectionApi from "../api/projection";
import type { ProjectionFrame } from "../api/projection";
import type { DeviceInfo } from "../types";

interface ProjectionViewProps {
  device: DeviceInfo;
  onClose: () => void;
}

export function ProjectionView({ device, onClose }: ProjectionViewProps) {
  const [isReceiving, setIsReceiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let unlistenFrame: (() => void) | null = null;
    let unlistenStarted: (() => void) | null = null;

    const startReceiving = async () => {
      try {
        setError(null);
        await projectionApi.startReceivingProjection(
          device.address,
          device.port
        );
        setIsReceiving(true);

        // 监听投影帧
        unlistenFrame = await projectionApi.listenProjectionFrame(
          (frame: ProjectionFrame) => {
            // 将 Base64 数据转换为图像并显示
            if (canvasRef.current) {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                const img = new Image();
                img.onload = () => {
                  canvas.width = frame.width;
                  canvas.height = frame.height;
                  ctx.drawImage(img, 0, 0);
                };
                img.src = `data:image/jpeg;base64,${frame.data}`;
              }
            }
          }
        );

        // 监听开始事件
        unlistenStarted = await projectionApi.listenReceivingProjectionStarted(
          () => {
            console.log("开始接收投影");
          }
        );
      } catch (err) {
        setError(String(err));
        setIsReceiving(false);
      }
    };

    startReceiving();

    return () => {
      // 清理
      if (unlistenFrame) {
        unlistenFrame();
      }
      if (unlistenStarted) {
        unlistenStarted();
      }
      projectionApi.stopReceivingProjection().catch(console.error);
    };
  }, [device]);

  const handleStop = async () => {
    try {
      await projectionApi.stopReceivingProjection();
      setIsReceiving(false);
      onClose();
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* 顶部控制栏 */}
      <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
        <h2 className="text-white text-base font-semibold">{device.name}</h2>
        <button
          onClick={handleStop}
          className="px-4 py-2 bg-red-500 text-white rounded-lg active:scale-95 transition-all duration-150 text-sm font-semibold"
        >
          关闭
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
          {error}
        </div>
      )}

      {/* 画布区域 */}
      <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
        {isReceiving ? (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain"
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <div className="text-white text-center">
            <p className="text-base">正在连接...</p>
          </div>
        )}
      </div>
    </div>
  );
}
