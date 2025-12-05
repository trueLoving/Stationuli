import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";

// 每个测试后清理
afterEach(() => {
  cleanup();
});

// 扩展 expect 匹配器
expect.extend({});
