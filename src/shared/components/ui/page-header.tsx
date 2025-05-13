import React from "react";

interface PageHeaderProps {
  title: string;
  rightContent?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  rightContent,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <h1 className="text-2xl font-bold">{title}</h1>
      {rightContent && (
        <div className="text-sm text-neutral-500">{rightContent}</div>
      )}
    </div>
  );
}
