// 投影相关 API 调用（移动端）

import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

/**
 * 开始投影（发送屏幕到目标设备）
 */
export async function startProjection(
  targetAddress: string,
  targetPort: number,
  fps?: number,
  quality?: number
): Promise<string> {
  return await invoke<string>("start_projection", {
    targetAddress,
    targetPort,
    fps,
    quality,
  });
}

/**
 * 停止投影
 */
export async function stopProjection(): Promise<string> {
  return await invoke<string>("stop_projection");
}

/**
 * 开始接收投影（从目标设备接收屏幕）
 */
export async function startReceivingProjection(
  targetAddress: string,
  targetPort: number
): Promise<string> {
  return await invoke<string>("start_receiving_projection", {
    targetAddress,
    targetPort,
  });
}

/**
 * 停止接收投影
 */
export async function stopReceivingProjection(): Promise<string> {
  return await invoke<string>("stop_receiving_projection");
}

/**
 * 投影帧数据接口
 */
export interface ProjectionFrame {
  width: number;
  height: number;
  timestamp: number;
  data: string; // Base64 编码的 JPEG 数据
}

/**
 * 监听投影帧事件
 */
export async function listenProjectionFrame(
  callback: (frame: ProjectionFrame) => void
): Promise<UnlistenFn> {
  return await listen<ProjectionFrame>("projection-frame", (event) => {
    callback(event.payload);
  });
}

/**
 * 监听投影开始事件
 */
export async function listenProjectionStarted(
  callback: () => void
): Promise<UnlistenFn> {
  return await listen("projection-started", callback);
}

/**
 * 监听接收投影开始事件
 */
export async function listenReceivingProjectionStarted(
  callback: () => void
): Promise<UnlistenFn> {
  return await listen("projection-receiving-started", callback);
}
