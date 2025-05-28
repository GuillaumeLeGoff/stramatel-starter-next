import { useEditor, useSlide } from "@/features/editor/hooks";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { useEffect, useMemo, useRef, useCallback } from "react";
import { KonvaShapeAttrs, KonvaNode, KonvaTextNodeAttrs, KonvaLiveTextAttrs } from "../../types";
import { slideStore } from "../../store/slideStore";
import {
  PaintBucket,
  PencilLine,
  Trash2,
  Bold,
  Italic,
  Type,
} from "lucide-react";

export function HeaderEditorComponents() {
  const {
    selectedShapes,
    updateSelectedShape,
    setSelectedShapes,
    getCurrentSlideKonvaData,
  } = useEditor();

  // Récupérer l'état d'édition de texte depuis le store
  const { editingTextId, editingTextShape } = slideStore();

  const konvaData = getCurrentSlideKonvaData();
  const { saveCurrentSlideKonvaData } = useSlide({
    stageData: konvaData,
    containerRef: { current: null },
  });

  const fillColorInputRef = useRef<HTMLInputElement>(null);
  const strokeColorInputRef = useRef<HTMLInputElement>(null);

  // Fonction utilitaire pour obtenir les attributs de texte selon le type
  const getTextAttrs = (shape: any): KonvaTextNodeAttrs | KonvaLiveTextAttrs => {
    if (shape.className === "Text") {
      return shape.attrs as KonvaTextNodeAttrs;
    } else {
      return shape.attrs as KonvaLiveTextAttrs;
    }
  };

  // Détermine le type de l'élément sélectionné ou en cours d'édition
  const selectedType = useMemo(() => {
    // Si on édite un texte, utiliser le type de la forme en cours d'édition
    if (editingTextId && editingTextShape) {
      return editingTextShape.className;
    }
    // Sinon, utiliser la forme sélectionnée
    if (!selectedShapes || selectedShapes.length === 0) return null;
    return selectedShapes[0].className;
  }, [selectedShapes, editingTextId, editingTextShape]);

  // Vérifie si l'élément sélectionné a une propriété de remplissage
  const hasFill = useMemo(() => {
    if (editingTextId && editingTextShape) {
      return (
        editingTextShape.className !== "Line" &&
        editingTextShape.className !== "Arrow"
      );
    }
    if (!selectedShapes || selectedShapes.length === 0) return false;
    return selectedType !== "Line" && selectedType !== "Arrow";
  }, [selectedType, selectedShapes, editingTextId, editingTextShape]);

  // Vérifie si l'élément sélectionné est un texte
  const isText = useMemo(() => {
    return selectedType === "Text" || 
           selectedType === "liveDate" || 
           selectedType === "liveTime" || 
           selectedType === "liveDateTime";
  }, [selectedType]);

  // Vérifie si l'élément sélectionné a des propriétés de contour (pas pour les textes)
  const hasStroke = useMemo(() => {
    if (!selectedShapes || selectedShapes.length === 0) return false;
    return selectedType !== "Text";
  }, [selectedType, selectedShapes]);

  // Récupère la couleur actuelle de l'élément sélectionné ou en cours d'édition
  const currentFillColor = useMemo(() => {
    // Si on édite un texte, utiliser ses propriétés
    if (editingTextId && editingTextShape) {
      const attrs = editingTextShape.attrs as KonvaShapeAttrs;
      return attrs.fill || "#000000";
    }
    // Sinon, utiliser la forme sélectionnée
    if (!selectedShapes || selectedShapes.length === 0) return "#000000";
    const attrs = selectedShapes[0].attrs as KonvaShapeAttrs;
    return attrs.fill || "#000000";
  }, [selectedShapes, editingTextId, editingTextShape]);

  // Récupère la couleur de contour actuelle de l'élément sélectionné
  const currentStrokeColor = useMemo(() => {
    if (!selectedShapes || selectedShapes.length === 0) return "#000000";
    // Utilisation d'une assertion de type pour éviter les erreurs TS
    const attrs = selectedShapes[0].attrs as KonvaShapeAttrs;
    return attrs.stroke || "#000000";
  }, [, selectedShapes]);

  // Récupère l'épaisseur de contour actuelle
  const currentStrokeWidth = useMemo(() => {
    if (!selectedShapes || selectedShapes.length === 0) return 1;
    // Utilisation d'une assertion de type pour éviter les erreurs TS
    const attrs = selectedShapes[0].attrs as KonvaShapeAttrs;
    return attrs.strokeWidth || 1;
  }, [selectedShapes]);

  // Propriétés spécifiques au texte
  const currentFontSize = useMemo(() => {
    if (!isText) return 16;

    // Si on édite un texte, utiliser ses propriétés
    if (editingTextId && editingTextShape) {
      const attrs = getTextAttrs(editingTextShape);
      return attrs.fontSize || 16;
    }

    // Sinon, utiliser la forme sélectionnée
    if (!selectedShapes || selectedShapes.length === 0) return 16;
    const attrs = getTextAttrs(selectedShapes[0]);
    return attrs.fontSize || 16;
  }, [selectedShapes, isText, editingTextId, editingTextShape]);

  const currentFontFamily = useMemo(() => {
    if (!isText) return "Arial";

    // Si on édite un texte, utiliser ses propriétés
    if (editingTextId && editingTextShape) {
      const attrs = getTextAttrs(editingTextShape);
      return attrs.fontFamily || "Arial";
    }

    // Sinon, utiliser la forme sélectionnée
    if (!selectedShapes || selectedShapes.length === 0) return "Arial";
    const attrs = getTextAttrs(selectedShapes[0]);
    return attrs.fontFamily || "Arial";
  }, [selectedShapes, isText, editingTextId, editingTextShape]);

  const currentFontStyle = useMemo(() => {
    if (!isText) return "normal";

    // Si on édite un texte, utiliser ses propriétés
    if (editingTextId && editingTextShape) {
      const attrs = getTextAttrs(editingTextShape);
      return attrs.fontStyle || "normal";
    }

    // Sinon, utiliser la forme sélectionnée
    if (!selectedShapes || selectedShapes.length === 0) return "normal";
    const attrs = getTextAttrs(selectedShapes[0]);
    return attrs.fontStyle || "normal";
  }, [selectedShapes, isText, editingTextId, editingTextShape]);

  const currentTextAlign = useMemo(() => {
    if (!isText) return "left";

    // Si on édite un texte, utiliser ses propriétés
    if (editingTextId && editingTextShape) {
      const attrs = getTextAttrs(editingTextShape);
      return attrs.align || "left";
    }

    // Sinon, utiliser la forme sélectionnée
    if (!selectedShapes || selectedShapes.length === 0) return "left";
    const attrs = getTextAttrs(selectedShapes[0]);
    return attrs.align || "left";
  }, [selectedShapes, isText, editingTextId, editingTextShape]);

  // Gère le changement de couleur de remplissage
  const handleFillColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    saveAttributeChanges({ fill: e.target.value });
  };

  // Gère le clic sur l'icône de seau pour ouvrir le sélecteur de couleur
  const handlePaintBucketClick = () => {
    fillColorInputRef.current?.click();
  };

  // Gère le changement de couleur de contour
  const handleStrokeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    saveAttributeChanges({ stroke: e.target.value });
  };

  // Gère le clic sur l'icône de crayon pour ouvrir le sélecteur de couleur de contour
  const handlePencilLineClick = () => {
    strokeColorInputRef.current?.click();
  };

  // Gère le changement d'épaisseur de contour
  const handleStrokeWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    saveAttributeChanges({ strokeWidth: Number(e.target.value) });
  };

  // Fonction utilitaire pour sauvegarder les changements d'attributs
  const saveAttributeChanges = useCallback(
    async (attrs: Record<string, unknown>) => {
      if (!konvaData) return;

      // Si on édite un texte, utiliser ses propriétés
      if (editingTextId && editingTextShape) {
        // Créer une copie mise à jour des données Konva
        const updatedKonvaData = JSON.parse(JSON.stringify(konvaData));

        // Trouver et mettre à jour la forme en cours d'édition
        if (updatedKonvaData?.children) {
          for (const layer of updatedKonvaData.children) {
            if (layer.children) {
              for (const child of layer.children) {
                if (child.attrs.id === editingTextId) {
                  Object.assign(child.attrs, attrs);
                  break;
                }
              }
            }
          }
        }

        // Sauvegarder les données mises à jour
        await saveCurrentSlideKonvaData(updatedKonvaData);
        return;
      }

      // Sinon, traiter les formes sélectionnées normalement
      if (!selectedShapes || selectedShapes.length === 0) return;

      // Mettre à jour l'état local d'abord
      updateSelectedShape(attrs);

      // Puis sauvegarder dans les données persistantes
      for (const shape of selectedShapes) {
        if (shape.attrs.id) {
          // Créer une copie mise à jour des données Konva
          const updatedKonvaData = JSON.parse(JSON.stringify(konvaData));

          // Trouver et mettre à jour la forme dans les données
          if (updatedKonvaData?.children) {
            for (const layer of updatedKonvaData.children) {
              if (layer.children) {
                for (const child of layer.children) {
                  if (child.attrs.id === shape.attrs.id) {
                    Object.assign(child.attrs, attrs);
                    break;
                  }
                }
              }
            }
          }

          // Sauvegarder les données mises à jour
          await saveCurrentSlideKonvaData(updatedKonvaData);
          break; // Sauvegarder une seule fois pour toutes les formes sélectionnées
        }
      }
    },
    [
      selectedShapes,
      updateSelectedShape,
      konvaData,
      saveCurrentSlideKonvaData,
      editingTextId,
      editingTextShape,
    ]
  );

  // Gestionnaires pour les propriétés de texte
  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    saveAttributeChanges({ fontSize: Number(e.target.value) });
  };

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    saveAttributeChanges({ fontFamily: e.target.value });
  };

  const handleToggleBold = () => {
    const newFontStyle = currentFontStyle === "bold" ? "normal" : "bold";
    saveAttributeChanges({ fontStyle: newFontStyle });
  };

  const handleToggleItalic = () => {
    const newFontStyle = currentFontStyle === "italic" ? "normal" : "italic";
    saveAttributeChanges({ fontStyle: newFontStyle });
  };

  const handleTextAlignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    saveAttributeChanges({ align: e.target.value });
  };

  // Supprimer les formes sélectionnées
  const handleClearSelection = useCallback(async () => {
    if (!selectedShapes || selectedShapes.length === 0) return;

    // Récupérer les données Konva actuelles
    const currentKonvaData = getCurrentSlideKonvaData();
    if (!currentKonvaData) return;

    // Créer une copie profonde du konvaData
    const updatedKonvaData = JSON.parse(JSON.stringify(currentKonvaData));

    // Récupérer les IDs des formes sélectionnées
    const selectedIds = selectedShapes.map((shape) => shape.attrs.id);
    console.log("selectedIds", selectedIds);
    // Fonction récursive pour supprimer les formes
    const removeShapesFromNodes = (nodes: KonvaNode[]): boolean => {
      let removed = false;

      // Pour chaque couche (Layer)
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        console.log("node", node);

        // Si le nœud a des enfants, filtrer pour supprimer les formes sélectionnées
        if (node.children && Array.isArray(node.children)) {
          // Filtrer les enfants directs
          const originalLength = node.children.length;
          node.children = node.children.filter(
            (child: KonvaNode) =>
              !(
                child.attrs &&
                child.attrs.id &&
                selectedIds.includes(child.attrs.id as string)
              )
          );

          // Vérifier si des enfants ont été supprimés à ce niveau
          removed = removed || node.children.length < originalLength;

          // Rechercher récursivement dans les enfants restants
        }
      }

      return removed;
    };

    // Appliquer la suppression
    if (updatedKonvaData.children) {
      if (removeShapesFromNodes(updatedKonvaData.children)) {
        // Enregistrer les modifications
        await saveCurrentSlideKonvaData(updatedKonvaData);
        console.log("Formes supprimées:", selectedIds);
      }
    }

    // Vider la sélection actuelle
    setSelectedShapes([]);
  }, [
    selectedShapes,
    getCurrentSlideKonvaData,
    saveCurrentSlideKonvaData,
    setSelectedShapes,
  ]);

  // Ajouter un écouteur d'événement pour la touche "Suppr" (Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si la touche Delete est pressée et qu'il y a des formes sélectionnées
      if (e.key === "Delete" && selectedShapes && selectedShapes.length > 0) {
        e.preventDefault(); // Empêcher le comportement par défaut
        handleClearSelection();
      }
    };

    // Ajouter l'écouteur d'événement
    window.addEventListener("keydown", handleKeyDown);

    // Nettoyer l'écouteur lors du démontage du composant
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedShapes, handleClearSelection]);

  return (
    <div className="flex items-center space-x-4 px-4">
      {selectedShapes.length === 0 && !editingTextId && ""}

      {(selectedShapes.length > 0 || editingTextId) && (
        <>
          {/* Contrôles spécifiques au texte */}
          {isText && (
            <>
              {/* Couleur du texte */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <button
                    onClick={handlePaintBucketClick}
                    className="p-1 rounded hover:bg-gray-100"
                    title="Couleur du texte"
                  >
                    <Type className="h-5 w-5" color={currentFillColor} />
                  </button>
                  <Input
                    ref={fillColorInputRef}
                    type="color"
                    id="fillColor"
                    value={currentFillColor}
                    onChange={handleFillColorChange}
                    className="h-0 w-0 opacity-0 absolute"
                  />
                </div>
              </div>

              {/* Séparateur vertical */}
              <div className="h-6 w-px bg-gray-300"></div>

              {/* Taille de police */}
              <div className="flex items-center space-x-2">
                <Label htmlFor="fontSize" className="text-xs">
                  Taille
                </Label>
                <Input
                  type="number"
                  id="fontSize"
                  min="8"
                  max="72"
                  step="1"
                  value={currentFontSize}
                  onChange={handleFontSizeChange}
                  className="h-8 w-16"
                />
              </div>

              {/* Séparateur vertical */}
              <div className="h-6 w-px bg-gray-300"></div>

              {/* Police */}
              <div className="flex items-center space-x-2">
                <Label htmlFor="fontFamily" className="text-xs">
                  Police
                </Label>
                <select
                  id="fontFamily"
                  value={currentFontFamily}
                  onChange={handleFontFamilyChange}
                  className="h-8 px-2 border border-gray-300 rounded text-sm"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Courier New">Courier New</option>
                </select>
              </div>

              {/* Séparateur vertical */}
              <div className="h-6 w-px bg-gray-300"></div>

              {/* Boutons Gras et Italique */}
              <div className="flex items-center space-x-1">
                <Button
                  variant={currentFontStyle === "bold" ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleBold}
                  className="h-8 w-8 p-0"
                  title="Gras"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant={
                    currentFontStyle === "italic" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={handleToggleItalic}
                  className="h-8 w-8 p-0"
                  title="Italique"
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </div>

              {/* Séparateur vertical */}
              <div className="h-6 w-px bg-gray-300"></div>

              {/* Alignement du texte */}
              <div className="flex items-center space-x-2">
                <Label htmlFor="textAlign" className="text-xs">
                  Alignement
                </Label>
                <select
                  id="textAlign"
                  value={currentTextAlign}
                  onChange={handleTextAlignChange}
                  className="h-8 px-2 border border-gray-300 rounded text-sm"
                >
                  <option value="left">Gauche</option>
                  <option value="center">Centre</option>
                  <option value="right">Droite</option>
                </select>
              </div>
            </>
          )}

          {/* Contrôles pour les autres formes (non-texte) */}
          {!isText && (
            <>
              {/* Contrôles de couleur de remplissage */}
              {hasFill && (
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <button
                      onClick={handlePaintBucketClick}
                      className="p-1 rounded hover:bg-gray-100"
                      title="Couleur de remplissage"
                    >
                      <PaintBucket
                        className="h-5 w-5"
                        color={currentFillColor}
                        fill={currentFillColor}
                      />
                    </button>
                    <Input
                      ref={fillColorInputRef}
                      type="color"
                      id="fillColor"
                      value={currentFillColor}
                      onChange={handleFillColorChange}
                      className="h-0 w-0 opacity-0 absolute"
                    />
                  </div>
                </div>
              )}

              {/* Séparateur vertical */}
              {hasFill && <div className="h-6 w-px bg-gray-300"></div>}

              {/* Contrôles de couleur de contour */}
              {hasStroke && (
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <button
                      onClick={handlePencilLineClick}
                      className="p-1 rounded hover:bg-gray-100"
                      title="Couleur de contour"
                    >
                      <PencilLine
                        className="h-5 w-5"
                        color={currentStrokeColor}
                        stroke={currentStrokeColor}
                      />
                    </button>
                    <Input
                      ref={strokeColorInputRef}
                      type="color"
                      id="strokeColor"
                      value={currentStrokeColor}
                      onChange={handleStrokeColorChange}
                      className="h-0 w-0 opacity-0 absolute"
                    />
                  </div>
                </div>
              )}

              {/* Séparateur vertical */}
              {hasStroke && <div className="h-6 w-px bg-gray-300"></div>}

              {/* Contrôle d'épaisseur de contour */}
              {hasStroke && (
                <div className="flex items-center space-x-2">
                  <Label htmlFor="strokeWidth" className="text-xs">
                    Épaisseur
                  </Label>
                  <Input
                    type="number"
                    id="strokeWidth"
                    min="0"
                    max="20"
                    step="1"
                    value={currentStrokeWidth}
                    onChange={handleStrokeWidthChange}
                    className="h-8 w-20"
                  />
                </div>
              )}
            </>
          )}

          {/* Séparateur vertical avant suppression */}
          <div className="h-6 w-px bg-gray-300"></div>

          {/* Bouton pour supprimer la sélection */}
          <div className="flex items-center">
            <button
              onClick={handleClearSelection}
              className="p-1 rounded hover:bg-gray-100"
              title="Supprimer les formes sélectionnées (ou touche Suppr)"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
