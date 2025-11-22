import React from "react";
import "./Card.css";

export interface CardProps {
  /** 标题 */
  title?: string;
  /** 子元素 */
  children: React.ReactNode;
  /** 额外类名 */
  className?: string;
}

/**
 * 卡片组件
 */
export function Card({ title, children, className }: CardProps) {
  const classNames = ["stationuli-card", className].filter(Boolean).join(" ");

  return (
    <div className={classNames}>
      {title && <div className="stationuli-card__title">{title}</div>}
      <div className="stationuli-card__content">{children}</div>
    </div>
  );
}
