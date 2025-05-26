import { useEditor } from "@/features/editor/hooks";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { KonvaShapeAttrs, KonvaNode } from "../types";
import { PaintBucket, PencilLine, Trash2 } from "lucide-react";

export function HeaderEditorComponents() {
  const {
    selectedShapes,
    updateSelectedShape,
    setSelectedShapes,
    getCurrentSlideKonvaData,
    saveCurrentSlideKonvaData,
  } = useEditor();

  const [isSelected, setIsSelected] = useState(false);
  const fillColorInputRef = useRef<HTMLInputElement>(null);
  const strokeColorInputRef = useRef<HTMLInputElement>(null);

  // Afficher les formes sélectionnées dans la console pour déboguer
  useEffect(() => {
    setIsSelected(selectedShapes && selectedShapes.length > 0);
  }, [selectedShapes]);

  // Détermine le type de l'élément sélectionné
  const selectedType = useMemo(() => {
    if (!selectedShapes || selectedShapes.length === 0) return null;
    return selectedShapes[0].className;
  }, [selectedShapes]);

  // Vérifie si l'élément sélectionné a une propriété de remplissage
  const hasFill = useMemo(() => {
    if (!selectedShapes || selectedShapes.length === 0) return false;
    return selectedType !== "Line" && selectedType !== "Arrow";
  }, [selectedType, selectedShapes]);

  // Récupère la couleur actuelle de l'élément sélectionné
  const currentFillColor = useMemo(() => {
    if (!selectedShapes || selectedShapes.length === 0) return "#000000";
    // Utilisation d'une assertion de type pour éviter les erreurs TS
    const attrs = selectedShapes[0].attrs as KonvaShapeAttrs;
    return attrs.fill || "#000000";
  }, [selectedShapes]);

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

  // Gère le changement de couleur de remplissage
  const handleFillColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSelectedShape({ fill: e.target.value });
  };

  // Gère le clic sur l'icône de seau pour ouvrir le sélecteur de couleur
  const handlePaintBucketClick = () => {
    fillColorInputRef.current?.click();
  };

  // Gère le changement de couleur de contour
  const handleStrokeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSelectedShape({ stroke: e.target.value });
  };

  // Gère le clic sur l'icône de crayon pour ouvrir le sélecteur de couleur de contour
  const handlePencilLineClick = () => {
    strokeColorInputRef.current?.click();
  };

  // Gère le changement d'épaisseur de contour
  const handleStrokeWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSelectedShape({ strokeWidth: Number(e.target.value) });
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
      {selectedShapes.length === 0 && ""}

      {selectedShapes.length > 0 && (
        <>
          {/* Contrôles de couleur de remplissage - non affiché pour   <div className="h-6 w-px bg-gray-300 mx-2"></div>les lignes et flèches */}
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

          {/* Séparateur vertical */}
          <div className="h-6 w-px bg-gray-300"></div>

          {/* Contrôle d'épaisseur de contour */}
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

          {/* Séparateur vertical */}
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
