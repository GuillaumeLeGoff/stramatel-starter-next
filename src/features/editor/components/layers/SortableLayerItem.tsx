import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

interface SortableLayerItemProps {
  id: string;
  children: React.ReactNode;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function SortableLayerItem({
  id,
  children,
  isSelected = false,
  onSelect,
}: SortableLayerItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors",
        "hover:bg-muted/50",
        isSelected && "bg-primary/10 border-primary",
        isDragging && "shadow-lg z-50"
      )}
      onClick={onSelect}
    >
      {/* Handle de drag */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing hover:bg-muted rounded p-1"
      >
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </div>

      {/* Contenu du calque */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
} 