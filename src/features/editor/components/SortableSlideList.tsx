import React from "react";
import { SlidePreview } from "./SlideComponent";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { SlideshowSlide } from "@/features/slideshow/types";
import { GripVertical } from "lucide-react";
import { useSlide } from "../hooks/useSlide";

interface SortableItemProps {
  slide: SlideshowSlide;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

function SortableItem({ slide, index, isActive, onClick }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: "12px",
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 999 : 1,
    position: "relative" as const,
    boxShadow: isDragging ? "0 5px 10px rgba(0, 0, 0, 0.15)" : "none",
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 h-6 w-6 bg-muted/80 rounded-sm z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <SlidePreview
        slide={slide}
        index={index}
        isActive={isActive}
        onClick={onClick}
      />
    </div>
  );
}

interface SortableSlideListProps {
  slides: SlideshowSlide[];
  currentSlide: number;
  onChangeSlide: (index: number) => void;
}

export function SortableSlideList({
  slides,
  currentSlide,
  onChangeSlide,
}: SortableSlideListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Utiliser le hook useSlide pour accéder à handleDragEnd
  const { handleDragEnd } = useSlide({
    stageData: null,
    containerRef: { current: null },
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => handleDragEnd(event, slides, onChangeSlide)}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext
        items={slides.map((slide) => slide.id.toString())}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {slides.map((slide, index) => (
            <SortableItem
              key={slide.id}
              slide={slide}
              index={index}
              isActive={index === currentSlide}
              onClick={() => onChangeSlide(index)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
