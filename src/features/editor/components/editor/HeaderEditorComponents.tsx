import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Minus,
  PaintBucket,
  PencilLine,
  Plus,
  Trash2,
  Type,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useHeaderShapeEditor } from "../../hooks/editor/useHeaderShapeEditor";
import { editorSelectors, useEditorStore } from "../../store/editorStore";

export function HeaderEditorComponents() {
  const {
    // État de base
    hasSelection,
    // isEditingText, // Non utilisé
    
    // Types de forme
    // isRectangle, // Non utilisé  
    // isCircle, // Non utilisé
    // isText, // Non utilisé
    // isData, // Non utilisé
    primaryType,
    
    // Flags de style
    hasFill,
    hasStroke,
    canEditText,
    isBold,
    isItalic,
    
    // Styles actuels
    currentFillColor,
    currentStrokeColor,
    currentStrokeWidth,
    currentFontSize,
    currentAlign,
    
    // Fonctions de style
    setFillColor,
    setStrokeColor,
    setStrokeWidth,
    setFontSize,
    setTextColor,
    toggleBold,
    toggleItalic,
    setTextAlign,
    deleteShapes,
  } = useHeaderShapeEditor();

  // Debug - Observer le cache Konva
  const konvaDataCache = useEditorStore(editorSelectors.konvaDataCache);
  const currentSlide = useEditorStore(editorSelectors.currentSlide);
  const debugRef = useRef<HTMLDivElement>(null);

  // États pour debug des raccourcis clavier
  const clipboardLength = useEditorStore((state) => state.clipboard.length);

  useEffect(() => {
    if (debugRef.current) {
      // const cachedData = konvaDataCache.get(currentSlide); // Non utilisé pour l'instant
      console.log('Cache updated for slide:', currentSlide);
    }
  }, [konvaDataCache, currentSlide]);

  return (
    <div className="flex items-center justify-between p-4 bg-background border-b">
      <div className="flex items-center gap-4">
        {/* Indicateur de sélection */}
        {hasSelection && (
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {primaryType} sélectionné
          </Badge>
        </div>
        )}
        <Separator orientation="vertical" className="h-6" />

        {/* Outils de couleur */}
        {hasFill && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <PaintBucket className="w-4 h-4" />
              <input
                type="color"
                value={currentFillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="w-8 h-8 rounded border"
              />
            </div>
          </div>
        )}

        {/* Couleur de texte pour les éléments de texte */}
        {canEditText && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Type className="w-4 h-4" />
              <input
                type="color"
                value={currentFillColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-8 h-8 rounded border"
              />
            </div>
          </div>
        )}

        {hasStroke && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <PencilLine className="w-4 h-4" />
              <input
                type="color"
                value={currentStrokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-8 h-8 rounded border"
              />
              <input
                type="number"
                value={currentStrokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                min="0"
                max="20"
                className="w-16 px-2 py-1 text-sm border rounded"
              />
            </div>
          </div>
        )}

        {/* Outils de texte */}
        {canEditText && (
          <>
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant={isBold ? "default" : "outline"}
                  size="sm"
                  onClick={toggleBold}
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  variant={isItalic ? "default" : "outline"}
                  size="sm"
                  onClick={toggleItalic}
                >
                  <Italic className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFontSize(Math.max(8, currentFontSize - 2))}
                  disabled={currentFontSize <= 8}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center text-sm">{currentFontSize}px</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFontSize(currentFontSize + 2)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant={currentAlign === "left" ? "default" : "outline"}
                size="sm"
                onClick={() => setTextAlign("left")}
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                variant={currentAlign === "center" ? "default" : "outline"}
                size="sm"
                onClick={() => setTextAlign("center")}
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                variant={currentAlign === "right" ? "default" : "outline"}
                size="sm"
                onClick={() => setTextAlign("right")}
              >
                <AlignRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

    

        {/* Actions générales */}
        <div className="flex items-center gap-2">
          {hasSelection && (
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteShapes}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

     
    </div>
  );
}
