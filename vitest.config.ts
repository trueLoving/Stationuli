import { defineConfig } from "vitest/config";

/**
 * 根目录 vitest 配置
 * 注意：当存在 vitest.workspace.ts 时，vitest 会自动使用 workspace 配置
 * 此文件仅作为备用配置，用于非工作区的测试
 */
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // 排除工作区目录，由各自的 vitest.config.ts 处理
    include: [],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/target/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/e2e/**",
      "packages/**",
      "apps/**",
    ],
  },
});
