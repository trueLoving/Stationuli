# 测试指南

本项目使用 Vitest Workspace 功能来管理多个工作区的测试：

- **packages/common**: 共享组件和工具函数
- **apps/desktop**: 桌面应用
- **apps/mobile**: 移动应用

## 安装依赖

所有测试依赖都在根目录统一管理，运行以下命令安装：

```bash
pnpm install
```

## 运行测试

### 运行所有工作区的测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch

# UI 界面
pnpm test:ui

# 查看覆盖率
pnpm test:coverage
```

### 运行特定工作区的测试

```bash
# 只运行 common 包的测试
pnpm test:common

# 只运行 desktop 应用的测试
pnpm test:desktop

# 只运行 mobile 应用的测试
pnpm test:mobile
```

### E2E 测试

```bash
# 运行 E2E 测试
pnpm test:e2e

# UI 模式
pnpm test:e2e:ui

# 调试模式
pnpm test:e2e:debug
```

### 运行所有测试（包括 E2E）

```bash
pnpm test:all
```

## 测试文件结构

```
.
├── vitest.workspace.ts          # Workspace 配置文件
├── vitest.setup.ts              # 全局测试设置
├── packages/
│   └── common/
│       ├── vitest.config.ts     # common 工作区配置
│       └── src/
│           ├── utils/
│           │   └── format.test.ts
│           └── components/
│               ├── Spinner.test.tsx
│               └── Tooltip.test.tsx
├── apps/
│   ├── desktop/
│   │   ├── vitest.config.ts     # desktop 工作区配置
│   │   └── src/
│   │       └── **/*.{test,spec}.{ts,tsx}
│   └── mobile/
│       ├── vitest.config.ts     # mobile 工作区配置
│       └── src/
│           └── **/*.{test,spec}.{ts,tsx}
└── e2e/
    └── example.spec.ts          # E2E 测试
```

## Workspace 配置说明

### vitest.workspace.ts

定义所有工作区：

```typescript
import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "./packages/common/vitest.config.ts",
  "./apps/desktop/vitest.config.ts",
  "./apps/mobile/vitest.config.ts",
]);
```

### 工作区配置文件

每个工作区都有自己的 `vitest.config.ts`，配置包括：

- **name**: 工作区名称（用于 `--project` 参数）
- **environment**: 测试环境（jsdom 用于 React 组件）
- **include**: 测试文件匹配模式（相对于工作区目录）
- **setupFiles**: 测试设置文件路径
- **resolve.alias**: 路径别名配置

## 编写测试

### 单元测试

单元测试文件应命名为 `*.test.ts` 或 `*.spec.ts`，放在与被测试文件相同的目录下。

示例（`packages/common/src/utils/format.test.ts`）：

```typescript
import { describe, it, expect } from "vitest";
import { formatBytes } from "./format";

describe("formatBytes", () => {
  it("应该正确格式化字节数", () => {
    expect(formatBytes(1024)).toBe("1.00 KB");
  });
});
```

### 组件测试

组件测试文件应命名为 `*.test.tsx` 或 `*.spec.tsx`。

示例（`packages/common/src/components/Spinner.test.tsx`）：

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  it("应该渲染加载动画", () => {
    render(<Spinner />);
    expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
  });
});
```

### E2E 测试

E2E 测试文件应放在 `e2e/` 目录下，命名为 `*.spec.ts`。

示例：

```typescript
import { test, expect } from "@playwright/test";

test("应该显示应用标题", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
});
```

## 配置说明

### 测试环境

- **packages/common**: `jsdom` - 用于 React 组件测试
- **apps/desktop**: `jsdom` - 用于 React 组件测试
- **apps/mobile**: `jsdom` - 用于 React 组件测试

### 路径别名

所有工作区都配置了 `stationuli-common` 别名，指向共享包：

```typescript
resolve: {
  alias: {
    "stationuli-common": path.resolve(__dirname, "../../packages/common/src"),
  },
}
```

### 覆盖率配置

覆盖率报告会生成在各自的 `coverage/` 目录下，包括：

- `text`: 终端输出
- `json`: JSON 格式报告
- `html`: HTML 格式报告

## 最佳实践

1. **测试隔离**: 每个工作区的测试独立运行，互不干扰
2. **测试命名**: 使用描述性的测试名称，说明测试的内容
3. **测试覆盖率**: 目标覆盖率 > 80%
4. **测试文件位置**: 测试文件放在与被测试文件相同的目录下
5. **工作区特定配置**: 每个工作区可以根据需要自定义配置

## 常见问题

### 如何只运行某个工作区的测试？

使用 `--project` 参数：

```bash
pnpm test:common    # 运行 common 工作区
pnpm test:desktop   # 运行 desktop 工作区
pnpm test:mobile    # 运行 mobile 工作区
```

### 如何查看特定工作区的覆盖率？

```bash
pnpm test:coverage --project common
```

### 测试文件找不到模块？

确保路径别名配置正确，检查工作区的 `vitest.config.ts` 中的 `resolve.alias` 配置。

### Playwright 浏览器未安装

如果遇到 Playwright 浏览器未安装的错误，运行：

```bash
pnpm exec playwright install
```
