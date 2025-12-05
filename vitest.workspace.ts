import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  // packages/common - 共享包
  "./packages/common/vitest.config.ts",
  // apps/desktop - 桌面应用
  "./apps/desktop/vitest.config.ts",
  // apps/mobile - 移动应用
  "./apps/mobile/vitest.config.ts",
]);
