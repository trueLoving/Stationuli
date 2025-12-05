import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
  it("应该在鼠标悬停时显示 Tooltip", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="测试提示">
        <button>悬停我</button>
      </Tooltip>
    );

    const button = screen.getByRole("button", { name: "悬停我" });
    await user.hover(button);

    await waitFor(
      () => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
        expect(screen.getByRole("tooltip")).toHaveTextContent("测试提示");
      },
      { timeout: 500 }
    );
  });

  it("应该在鼠标离开时隐藏 Tooltip", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="测试提示">
        <button>悬停我</button>
      </Tooltip>
    );

    const button = screen.getByRole("button", { name: "悬停我" });
    await user.hover(button);

    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    await user.unhover(button);

    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  it("应该支持不同的位置", () => {
    const { rerender } = render(
      <Tooltip content="测试" position="top">
        <button>按钮</button>
      </Tooltip>
    );

    rerender(
      <Tooltip content="测试" position="bottom">
        <button>按钮</button>
      </Tooltip>
    );

    rerender(
      <Tooltip content="测试" position="left">
        <button>按钮</button>
      </Tooltip>
    );

    rerender(
      <Tooltip content="测试" position="right">
        <button>按钮</button>
      </Tooltip>
    );

    // 基本渲染测试
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
