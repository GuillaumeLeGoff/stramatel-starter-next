import React, { useRef, useEffect, useCallback, useState } from "react";
import { Circle, Group } from "react-konva";
import Konva from "konva";

interface ArrowTransformerProps {
  target: Konva.Arrow | null;
  onPointsChange: (points: number[]) => void;
  scale?: number;
}

export const ArrowTransformer: React.FC<ArrowTransformerProps> = ({
  target,
  onPointsChange,
  scale = 1,
}) => {
  const startAnchorRef = useRef<Konva.Circle>(null);
  const endAnchorRef = useRef<Konva.Circle>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPointsRef = useRef<number[] | null>(null);

  // ✅ États pour les positions des ancres (mises à jour en temps réel)
  const [anchorPositions, setAnchorPositions] = useState({
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 }
  });

  // Taille des ancres ajustée selon le zoom
  const anchorSize = 8 / scale;

  // ✅ Fonction debouncée pour sauvegarder
  const debouncedSave = useCallback((points: number[]) => {
    // Annuler le timeout précédent
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Programmer une nouvelle sauvegarde après 300ms d'inactivité
    saveTimeoutRef.current = setTimeout(() => {
      console.log("🔥 Sauvegarde des points de flèche (après stabilisation):", points);
      onPointsChange(points);
      lastPointsRef.current = points;
    }, 300);
  }, [onPointsChange]);

  // Calculer les positions des ancres basées sur les points de la flèche
  const getAnchorPositions = useCallback(() => {
    if (!target) return { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };

    const points = target.points();
    const position = target.position();
    
    if (!points || points.length < 4) {
      return { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };
    }

    return {
      start: {
        x: position.x + points[0],
        y: position.y + points[1],
      },
      end: {
        x: position.x + points[2],
        y: position.y + points[3],
      },
    };
  }, [target]);

  // ✅ Mettre à jour les positions des ancres dans l'état
  const updateAnchors = useCallback(() => {
    if (!target) return;

    const positions = getAnchorPositions();
    setAnchorPositions(positions);
    
    console.log("🎯 Mise à jour positions ancres:", positions);
  }, [getAnchorPositions, target]);

  // ✅ Gérer le drag des ancres avec mise à jour visuelle immédiate
  const handleAnchorDrag = useCallback((isStart: boolean) => {
    return (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!target) return;

      const anchor = e.target as Konva.Circle;
      const newPosition = anchor.position();
      const arrowPosition = target.position();
      
      // ✅ Mettre à jour immédiatement la position de l'ancre dans l'état
      setAnchorPositions(prev => ({
        ...prev,
        [isStart ? 'start' : 'end']: newPosition
      }));
      
      // Convertir la position absolue de l'ancre en position relative à la flèche
      const relativeX = newPosition.x - arrowPosition.x;
      const relativeY = newPosition.y - arrowPosition.y;

      const currentPoints = target.points();
      if (!currentPoints || currentPoints.length < 4) return;

      let newPoints;
      if (isStart) {
        // Modifier le point de départ
        newPoints = [relativeX, relativeY, currentPoints[2], currentPoints[3]];
      } else {
        // Modifier le point d'arrivée
        newPoints = [currentPoints[0], currentPoints[1], relativeX, relativeY];
      }

      // ✅ Appliquer immédiatement les changements visuels à la flèche
      target.points(newPoints);
      target.getLayer()?.batchDraw();

      // ✅ Sauvegarder avec debouncing (seulement après stabilisation)
      debouncedSave(newPoints);
    };
  }, [target, debouncedSave]);

  // ✅ Gérer la fin du drag pour remettre à jour les positions finales
  const handleAnchorDragEnd = useCallback((isStart: boolean) => {
    return (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!target) return;
      
      console.log(`🏁 Fin de drag ancre ${isStart ? 'start' : 'end'}`);
      
      // Mettre à jour les positions finales des ancres
      updateAnchors();
    };
  }, [target, updateAnchors]);

  // Mettre à jour les ancres quand la cible change
  useEffect(() => {
    if (target) {
      updateAnchors();
    }
  }, [target, updateAnchors]);

  // ✅ Mettre à jour les ancres quand les points de la flèche changent (depuis l'extérieur)
  useEffect(() => {
    if (target) {
      const handlePointsChange = () => {
        updateAnchors();
      };
      
      const handleDragMove = () => {
        // 🔥 SOLUTION: Mettre à jour les ancres pendant le drag
        updateAnchors();
      };
      
      // Écouter les changements sur la flèche
      target.on('transform transformend', handlePointsChange);
      // 🔥 SOLUTION: Écouter aussi le drag pour suivre le mouvement
      target.on('dragmove', handleDragMove);
      target.on('dragend', handlePointsChange);
      
      return () => {
        target.off('transform transformend', handlePointsChange);
        target.off('dragmove', handleDragMove);
        target.off('dragend', handlePointsChange);
      };
    }
  }, [target, updateAnchors]);

  // ✅ Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Si pas de cible, ne rien afficher
  if (!target) return null;

  return (
    <Group>
      {/* Ancre de départ */}
      <Circle
        ref={startAnchorRef}
        x={anchorPositions.start.x}
        y={anchorPositions.start.y}
        radius={anchorSize}
        fill="#4A90E2"
        stroke="#FFFFFF"
        strokeWidth={2 / scale}
        draggable
        onDragMove={handleAnchorDrag(true)}
        onDragEnd={handleAnchorDragEnd(true)}
        name="arrow-start-anchor"
      />
      
      {/* Ancre d'arrivée */}
      <Circle
        ref={endAnchorRef}
        x={anchorPositions.end.x}
        y={anchorPositions.end.y}
        radius={anchorSize}
        fill="#E24A4A"
        stroke="#FFFFFF"
        strokeWidth={2 / scale}
        draggable
        onDragMove={handleAnchorDrag(false)}
        onDragEnd={handleAnchorDragEnd(false)}
        name="arrow-end-anchor"
      />
    </Group>
  );
}; 