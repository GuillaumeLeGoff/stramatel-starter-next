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
import { useEffect, useRef, useState, useCallback } from "react";
import { useHeaderShapeEditor } from "../../hooks/editor/useHeaderShapeEditor";
import { editorSelectors, useEditorStore } from "../../store/editorStore";
import { ARROW_TYPES, ArrowType } from "../../constants";

function getTypeDisplayName(type: string | null): string {
  if (!type) return "";
  const map: Record<string, string> = {
    rectangle: "Rectangle",
    circle: "Cercle",
    triangle: "Triangle",
    text: "Texte",
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

  // ✅ DEBOUNCE: États locaux pour les couleurs et styles
  const [localFillColor, setLocalFillColor] = useState(currentFillColor);
  const [localStrokeColor, setLocalStrokeColor] = useState(currentStrokeColor);
  const [localTextColor, setLocalTextColor] = useState(currentFillColor);
  const [localStrokeWidth, setLocalStrokeWidth] = useState(currentStrokeWidth);
  const [localFontSize, setLocalFontSize] = useState(currentFontSize);
  
  // ✅ DEBOUNCE: Refs pour les timeouts
  const fillColorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const strokeColorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textColorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const strokeWidthTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fontSizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Synchroniser les couleurs locales avec les props
  useEffect(() => {
    setLocalFillColor(currentFillColor);
    setLocalTextColor(currentFillColor);
  }, [currentFillColor]);

  useEffect(() => {
    setLocalStrokeColor(currentStrokeColor);
  }, [currentStrokeColor]);

  useEffect(() => {
    setLocalStrokeWidth(currentStrokeWidth);
  }, [currentStrokeWidth]);

  useEffect(() => {
    setLocalFontSize(currentFontSize);
  }, [currentFontSize]);

  // ✅ Nettoyage des timeouts au démontage
  useEffect(() => {
    return () => {
      if (fillColorTimeoutRef.current) clearTimeout(fillColorTimeoutRef.current);
      if (strokeColorTimeoutRef.current) clearTimeout(strokeColorTimeoutRef.current);
      if (textColorTimeoutRef.current) clearTimeout(textColorTimeoutRef.current);
      if (strokeWidthTimeoutRef.current) clearTimeout(strokeWidthTimeoutRef.current);
      if (fontSizeTimeoutRef.current) clearTimeout(fontSizeTimeoutRef.current);
    };
  }, []);

  // ✅ DEBOUNCE: Gestionnaires de couleur avec debounce
  const handleFillColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setLocalFillColor(newColor);
    
    if (fillColorTimeoutRef.current) {
      clearTimeout(fillColorTimeoutRef.current);
    }
    
    fillColorTimeoutRef.current = setTimeout(() => {
      setFillColor(newColor);
    }, 250); // 250ms de debounce
  }, [setFillColor]);

  const handleStrokeColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setLocalStrokeColor(newColor);
    
    if (strokeColorTimeoutRef.current) {
      clearTimeout(strokeColorTimeoutRef.current);
    }
    
    strokeColorTimeoutRef.current = setTimeout(() => {
      setStrokeColor(newColor);
    }, 250); // 250ms de debounce
  }, [setStrokeColor]);

  const handleTextColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setLocalTextColor(newColor);
    
    if (textColorTimeoutRef.current) {
      clearTimeout(textColorTimeoutRef.current);
    }
    
    textColorTimeoutRef.current = setTimeout(() => {
      setTextColor(newColor);
    }, 250); // 250ms de debounce
  }, [setTextColor]);

  const handleStrokeWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Number(e.target.value);
    setLocalStrokeWidth(newWidth);
    
    if (strokeWidthTimeoutRef.current) {
      clearTimeout(strokeWidthTimeoutRef.current);
    }
    
    strokeWidthTimeoutRef.current = setTimeout(() => {
      setStrokeWidth(newWidth);
    }, 250); // 250ms de debounce
  }, [setStrokeWidth]);

  // ✅ DEBOUNCE: Gestionnaires pour la taille de police avec debounce
  const handleFontSizeDecrease = useCallback(() => {
    const newSize = Math.max(8, localFontSize - 2);
    setLocalFontSize(newSize);
    
    if (fontSizeTimeoutRef.current) {
      clearTimeout(fontSizeTimeoutRef.current);
    }
    
    fontSizeTimeoutRef.current = setTimeout(() => {
      setFontSize(newSize);
    }, 200); // 200ms de debounce (plus rapide pour les boutons)
  }, [localFontSize, setFontSize]);

  const handleFontSizeIncrease = useCallback(() => {
    const newSize = localFontSize + 2;
    setLocalFontSize(newSize);
    
    if (fontSizeTimeoutRef.current) {
      clearTimeout(fontSizeTimeoutRef.current);
    }
    
    fontSizeTimeoutRef.current = setTimeout(() => {
      setFontSize(newSize);
    }, 200); // 200ms de debounce (plus rapide pour les boutons)
  }, [localFontSize, setFontSize]);

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
                    value={localFillColor}
                    onChange={handleFillColorChange}
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
                    value={localTextColor}
                    onChange={handleTextColorChange}
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
                    value={localStrokeColor}
                    onChange={handleStrokeColorChange}
                    className="w-8 h-8 rounded border"
                  />
                  <input
                    type="number"
                    value={localStrokeWidth}
                    onChange={handleStrokeWidthChange}
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
                      onClick={handleFontSizeDecrease}
                      disabled={localFontSize <= 8}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center text-sm">{localFontSize}px</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFontSizeIncrease}
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

