import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    name: "mobile",
    globals: true,
    environment: "jsdom",
    setupFiles: [path.resolve(__dirname, "../../vitest.setup.ts")],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/target/**",
      "**/src-tauri/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/e2e/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/target/**",
        "**/src-tauri/**",
        "**/*.config.{js,ts}",
        "**/*.d.ts",
        "**/e2e/**",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
      ],
    },
  },
  resolve: {
    alias: {
      "stationuli-common": path.resolve(__dirname, "../../packages/common/src"),
    },
  },
});
