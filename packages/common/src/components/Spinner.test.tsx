import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  it("应该渲染加载动画", () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.tagName).toBe("svg");
  });

  it("应该支持不同尺寸", () => {
    const { rerender, container } = render(<Spinner size="sm" />);
    let svg = container.querySelector("svg");
    expect(svg).toHaveClass("w-4", "h-4");

    rerender(<Spinner size="md" />);
    svg = container.querySelector("svg");
    expect(svg).toHaveClass("w-5", "h-5");

    rerender(<Spinner size="lg" />);
    svg = container.querySelector("svg");
    expect(svg).toHaveClass("w-6", "h-6");
  });

  it("应该支持自定义 className", () => {
    const { container } = render(<Spinner className="custom-class" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("custom-class");
  });

  it("应该有旋转动画", () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("animate-spin");
  });

  it("应该隐藏于屏幕阅读器", () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});
