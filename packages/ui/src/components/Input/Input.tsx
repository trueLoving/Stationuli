import React from "react";
import "./Input.css";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** 标签 */
  label?: string;
  /** 错误信息 */
  error?: string;
  /** 帮助文本 */
  helperText?: string;
}

/**
 * 输入框组件
 */
export function Input({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const classNames = [
    "stationuli-input",
    error && "stationuli-input--error",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="stationuli-input-wrapper">
      {label && (
        <label htmlFor={inputId} className="stationuli-input__label">
          {label}
        </label>
      )}
      <input id={inputId} className={classNames} {...props} />
      {error && <span className="stationuli-input__error">{error}</span>}
      {helperText && !error && (
        <span className="stationuli-input__helper">{helperText}</span>
      )}
    </div>
  );
}
