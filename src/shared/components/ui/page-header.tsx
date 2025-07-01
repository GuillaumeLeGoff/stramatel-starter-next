import React from "react";
import { cn } from "@/lib/utils";

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
    <div className={cn(
      "flex items-center justify-between py-4 px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      {rightContent && (
        <div className="text-sm text-muted-foreground">{rightContent}</div>
      )}
    </div>
  );
}
