// 投影视图组件

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
  const imageRef = useRef<HTMLImageElement | null>(null);

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
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-6xl w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            投影视图 - {device.name}
          </h2>
          <button
            onClick={handleStop}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            关闭
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]">
          {isReceiving ? (
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[80vh] object-contain"
            />
          ) : (
            <div className="text-white text-center py-20">
              <p className="text-lg">正在连接...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
