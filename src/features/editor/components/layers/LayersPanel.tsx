import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { useEditorStore, editorSelectors } from "../../store/editorStore";
import { SortableLayerItem } from "./SortableLayerItem";

interface LayersPanelProps {
  konvaData: any;
}

export function LayersPanel({ konvaData }: LayersPanelProps) {
  const selectedShapes = useEditorStore(editorSelectors.selectedShapes);
  const setSelectedShapes = useEditorStore((state) => state.setSelectedShapes);
  const updateLayerOrder = useEditorStore((state) => state.updateLayerOrder);
  
  // Configuration des capteurs de drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Extraire tous les éléments du canvas
  const getAllShapes = (): any[] => {
    if (!konvaData?.children?.[0]?.children) return [];
    
    return konvaData.children[0].children
      .filter((shape: any) => shape.attrs?.id)
      .reverse(); // Inverser pour que le premier élément soit au-dessus
  };

  const shapes = getAllShapes();

  // Gestionnaire de fin de drag
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = shapes.findIndex((shape) => shape.attrs.id === active.id);
      const newIndex = shapes.findIndex((shape) => shape.attrs.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(shapes, oldIndex, newIndex);
        updateLayerOrder(newOrder.map(shape => shape.attrs.id));
      }
    }
  };

  // Sélectionner un calque
  const handleSelectLayer = (shapeId: string) => {
    const shape = shapes.find(s => s.attrs.id === shapeId);
    if (shape) {
      const isSelected = selectedShapes.some(s => s.attrs?.id === shapeId);
      if (isSelected) {
        setSelectedShapes([]);
      } else {
        setSelectedShapes([shape]);
      }
    }
  };

  // Obtenir le nom d'affichage d'un calque
  const getLayerDisplayName = (shape: any): string => {
    const type = shape.className || 'Unknown';
    const id = shape.attrs?.id || '';
    
    switch (type) {
      case 'Rect':
        return `Rectangle ${id.slice(-4)}`;
      case 'Circle':
        return `Cercle ${id.slice(-4)}`;
      case 'Text':
        return `Texte "${shape.attrs?.text?.slice(0, 10) || ''}..."`;
      case 'Image':
        return `Image ${id.slice(-4)}`;
      default:
        return `${type} ${id.slice(-4)}`;
    }
  };

  if (shapes.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="text-sm">Aucun calque disponible</p>
        <p className="text-xs mt-1">Ajoutez des éléments au canvas</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={shapes.map(shape => shape.attrs.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="p-2 space-y-1">
              {shapes.map((shape, index) => {
                const isSelected = selectedShapes.some(s => s.attrs?.id === shape.attrs.id);
                
                return (
                  <SortableLayerItem
                    key={shape.attrs.id}
                    id={shape.attrs.id}
                    isSelected={isSelected}
                    onSelect={() => handleSelectLayer(shape.attrs.id)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Icône de type */}
                        <div className="w-4 h-4 rounded bg-muted flex items-center justify-center text-xs">
                          {shape.className === 'Rect' && '▢'}
                          {shape.className === 'Circle' && '●'}
                          {shape.className === 'Text' && 'T'}
                          {shape.className === 'Image' && '🖼'}
                        </div>
                        
                        {/* Nom du calque */}
                        <span className="text-sm truncate">
                          {getLayerDisplayName(shape)}
                        </span>
                      </div>
                    </div>
                  </SortableLayerItem>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
} 