import React from "react";
import "./Button.css";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮变体 */
  variant?: "primary" | "secondary" | "danger";
  /** 按钮大小 */
  size?: "small" | "medium" | "large";
  /** 是否加载中 */
  loading?: boolean;
  /** 子元素 */
  children: React.ReactNode;
}

/**
 * 按钮组件
 */
export function Button({
  variant = "primary",
  size = "medium",
  loading = false,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const classNames = [
    "stationuli-button",
    `stationuli-button--${variant}`,
    `stationuli-button--${size}`,
    loading && "stationuli-button--loading",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classNames} disabled={disabled || loading} {...props}>
      {loading && <span className="stationuli-button__spinner" />}
      {children}
    </button>
  );
}
