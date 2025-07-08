import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
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
  ArrowRight,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useHeaderShapeEditor } from "../../hooks/editor/useHeaderShapeEditor";
import { editorSelectors, useEditorStore } from "../../store/editorStore";
import { ARROW_TYPES, ArrowType } from "../../constants";

function getTypeDisplayName(type: string | null): string {
  if (!type) return "";
  const map: Record<string, string> = {
    rectangle: "Rectangle",
    circle: "Cercle",
    text: "Texte",
    line: "Ligne",
    arrow: "Flèche",
    image: "Image",
    video: "Vidéo",
    livedate: "Date",
    livetime: "Heure",
    livedatetime: "Date & Heure",
    currentdayswithoutaccident: "Jours sans accident",
    currentdayswithoutaccidentwithstop: "Jours sans arrêt",
    currentdayswithoutaccidentwithoutstop: "Jours sans arrêt léger",
    recorddayswithoutaccident: "Record jours sans accident",
    yearlyaccidentscount: "Accidents cette année",
    yearlyaccidentswithstopcount: "Accidents avec arrêt",
    yearlyaccidentswithoutstopcount: "Accidents sans arrêt",
    monthlyaccidentscount: "Accidents ce mois",
    lastaccidentdate: "Dernier accident",
    monitoringstartdate: "Début de suivi",
  };
  return map[type.toLowerCase()] || type;
}

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
    isArrow,
    
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
    
    // Propriétés des flèches
    currentArrowType,
    currentPointerLength,
    currentPointerWidth,
    
    // Fonctions de style
    setFillColor,
    setStrokeColor,
    setStrokeWidth,
    setFontSize,
    setTextColor,
    toggleBold,
    toggleItalic,
    setTextAlign,
    setArrowType,
    deleteShapes,
  } = useHeaderShapeEditor();

  // Debug - Observer le cache Konva
  const konvaDataCache = useEditorStore(editorSelectors.konvaDataCache);
  const currentSlide = useEditorStore(editorSelectors.currentSlide);
  const debugRef = useRef<HTMLDivElement>(null);

  // États pour debug des raccourcis clavier
  const clipboardLength = useEditorStore((state) => state.clipboard.length);

  // Vérifier si l'élément sélectionné est une vidéo, un média ou une image
  const isVideoOrMedia = primaryType === 'video' || primaryType === 'media' || primaryType === 'image';

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
            {getTypeDisplayName(primaryType)} 
          </Badge>
        </div>
        )}
        
        {/* Ne pas afficher les outils d'édition pour les vidéos et médias */}
        {!isVideoOrMedia && (
          <>
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
                    className="w-16 px-2 py-1 text-sm border rounded no-spinner"
                  />
                </div>
              </div>
            )}

            {/* Outils pour les flèches */}
            {isArrow && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <ArrowRight className="w-4 h-4" />
                    <Select
                      value={currentArrowType}
                      onValueChange={(value: ArrowType) => setArrowType(value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue>
                          <span className="flex items-center gap-2">
                            <span className="text-lg">{ARROW_TYPES[currentArrowType].icon}</span>
                            <span className="text-sm">{ARROW_TYPES[currentArrowType].name}</span>
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ARROW_TYPES).map(([type, config]) => (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{config.icon}</span>
                              <span className="text-sm">{config.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
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

