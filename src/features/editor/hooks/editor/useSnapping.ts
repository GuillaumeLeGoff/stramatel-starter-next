import { useCallback } from 'react';
import Konva from 'konva';

// Distance maximale pour déclencher le snapping (en pixels)
const GUIDELINE_OFFSET = 5;

type Snap = "start" | "center" | "end";

interface SnappingEdges {
  vertical: Array<{
    guide: number;
    offset: number;
    snap: Snap;
  }>;
  horizontal: Array<{
    guide: number;
    offset: number;
    snap: Snap;
  }>;
}

export function useSnapping() {
  // Obtenir les points de snapping disponibles (bords du stage + bords des objets)
  const getLineGuideStops = useCallback((skipShape: Konva.Shape) => {
    const stage = skipShape.getStage();
    if (!stage) {
      console.log('❌ Stage not found in snapping');
      return { vertical: [], horizontal: [] };
    }

    console.log('🔍 Getting line guide stops...');

    // Points de snapping du stage (bords et centre)
    const vertical = [0, stage.width() / 2, stage.width()];
    const horizontal = [0, stage.height() / 2, stage.height()];

    console.log('📏 Stage snapping points:', { 
      stageWidth: stage.width(), 
      stageHeight: stage.height(),
      vertical: vertical.slice(), 
      horizontal: horizontal.slice() 
    });

    // ✅ CORRECTION : Utiliser le même système que l'exemple
    // Chercher toutes les formes avec le nom "object"
    stage.find('.object').forEach((guideItem) => {
      if (guideItem === skipShape) {
        console.log('⏭️ Skipping current drag target');
        return;
      }

      try {
        const box = guideItem.getClientRect();
        console.log(`📐 Shape (${guideItem.className}) box:`, box);
        
        // Ajouter tous les bords et le centre de chaque forme
        vertical.push(box.x, box.x + box.width, box.x + box.width / 2);
        horizontal.push(box.y, box.y + box.height, box.y + box.height / 2);
      } catch (error) {
        console.warn(`⚠️ Error getting client rect for shape:`, error);
      }
    });

    console.log('📊 Final snapping points:', {
      verticalCount: vertical.length,
      horizontalCount: horizontal.length,
      vertical: [...new Set(vertical)],
      horizontal: [...new Set(horizontal)]
    });

    return {
      vertical,
      horizontal,
    };
  }, []);

  // Obtenir les points de snapping d'un objet (bords et centre)
  const getObjectSnappingEdges = useCallback((node: Konva.Shape): SnappingEdges => {
    try {
      const box = node.getClientRect();
      const absPos = node.absolutePosition();

      console.log('🎯 Object snapping edges:', { box, absPos });

      return {
        vertical: [
          {
            guide: Math.round(box.x),
            offset: Math.round(absPos.x - box.x),
            snap: 'start',
          },
          {
            guide: Math.round(box.x + box.width / 2),
            offset: Math.round(absPos.x - box.x - box.width / 2),
            snap: 'center',
          },
          {
            guide: Math.round(box.x + box.width),
            offset: Math.round(absPos.x - box.x - box.width),
            snap: 'end',
          },
        ],
        horizontal: [
          {
            guide: Math.round(box.y),
            offset: Math.round(absPos.y - box.y),
            snap: 'start',
          },
          {
            guide: Math.round(box.y + box.height / 2),
            offset: Math.round(absPos.y - box.y - box.height / 2),
            snap: 'center',
          },
          {
            guide: Math.round(box.y + box.height),
            offset: Math.round(absPos.y - box.y - box.height),
            snap: 'end',
          },
        ],
      };
    } catch (error) {
      console.error('❌ Error getting object snapping edges:', error);
      return { vertical: [], horizontal: [] };
    }
  }, []);

  // Trouver tous les guides de snapping possibles
  const getGuides = useCallback((
    lineGuideStops: ReturnType<typeof getLineGuideStops>,
    itemBounds: SnappingEdges
  ) => {
    const resultV: Array<{
      lineGuide: number;
      diff: number;
      snap: Snap;
      offset: number;
    }> = [];

    const resultH: Array<{
      lineGuide: number;
      diff: number;
      snap: Snap;
      offset: number;
    }> = [];

    lineGuideStops.vertical.forEach((lineGuide) => {
      itemBounds.vertical.forEach((itemBound) => {
        const diff = Math.abs(lineGuide - itemBound.guide);
        if (diff < GUIDELINE_OFFSET) {
          resultV.push({
            lineGuide: lineGuide,
            diff: diff,
            snap: itemBound.snap,
            offset: itemBound.offset,
          });
        }
      });
    });

    lineGuideStops.horizontal.forEach((lineGuide) => {
      itemBounds.horizontal.forEach((itemBound) => {
        const diff = Math.abs(lineGuide - itemBound.guide);
        if (diff < GUIDELINE_OFFSET) {
          resultH.push({
            lineGuide: lineGuide,
            diff: diff,
            snap: itemBound.snap,
            offset: itemBound.offset,
          });
        }
      });
    });

    const guides: Array<{
      lineGuide: number;
      offset: number;
      orientation: 'V' | 'H';
      snap: 'start' | 'center' | 'end';
    }> = [];

    // Trouver le snap le plus proche pour chaque direction
    const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
    const minH = resultH.sort((a, b) => a.diff - b.diff)[0];

    if (minV) {
      guides.push({
        lineGuide: minV.lineGuide,
        offset: minV.offset,
        orientation: 'V',
        snap: minV.snap,
      });
      console.log('📐 Vertical snapping guide found:', minV);
    }
    if (minH) {
      guides.push({
        lineGuide: minH.lineGuide,
        offset: minH.offset,
        orientation: 'H',
        snap: minH.snap,
      });
      console.log('📐 Horizontal snapping guide found:', minH);
    }

    return guides;
  }, []);

  // Dessiner les lignes guides visuelles
  const drawGuides = useCallback((
    guides: ReturnType<typeof getGuides>,
    layer: Konva.Layer
  ) => {
    console.log(`✏️ Drawing ${guides.length} guides`);

    guides.forEach((lg, index) => {
      if (lg.orientation === 'H') {
        // Ligne horizontale
        const line = new Konva.Line({
          points: [-6000, 0, 6000, 0],
          stroke: 'rgb(0, 161, 255)',
          strokeWidth: 1,
          name: 'guide-line',
          dash: [4, 6],
          listening: false,
        });
        layer.add(line);
        line.absolutePosition({
          x: 0,
          y: lg.lineGuide,
        });
        console.log(`➡️ Horizontal guide ${index} at y=${lg.lineGuide}`);
      } else if (lg.orientation === 'V') {
        // Ligne verticale
        const line = new Konva.Line({
          points: [0, -6000, 0, 6000],
          stroke: 'rgb(0, 161, 255)',
          strokeWidth: 1,
          name: 'guide-line',
          dash: [4, 6],
          listening: false,
        });
        layer.add(line);
        line.absolutePosition({
          x: lg.lineGuide,
          y: 0,
        });
        console.log(`⬇️ Vertical guide ${index} at x=${lg.lineGuide}`);
      }
    });

    layer.draw();
  }, []);

  // ✅ CORRECTION : Handler principal basé sur l'exemple qui fonctionne
  const handleSnapDragMove = useCallback((e: Konva.KonvaEventObject<Event>) => {
    const target = e.target as Konva.Shape;
    const layer = target.getLayer();
    
    if (!layer) {
      console.log('❌ Layer not found for snapping');
      return;
    }

    console.log('🎯 Snapping drag move triggered for:', target.className, target.id());
    
    // ✅ Nettoyer toutes les lignes guides précédentes
    layer.find('.guide-line').forEach((l) => l.destroy());

    // Trouver les points de snapping possibles
    const lineGuideStops = getLineGuideStops(target);
    // Trouver les points de snapping de l'objet actuel
    const itemBounds = getObjectSnappingEdges(target);

    // Maintenant trouver où on peut snapper l'objet actuel
    const guides = getGuides(lineGuideStops, itemBounds);

    // Ne rien faire s'il n'y a pas de snapping
    if (!guides.length) {
      console.log('🚫 No snapping guides found');
      return;
    }

    console.log(`✅ Found ${guides.length} snapping guides`);

    // Dessiner les guides
    drawGuides(guides, layer);

    // ✅ CORRECTION : Logique simplifiée basée sur l'exemple
    const absPos = target.absolutePosition();
    const originalPos = { ...absPos };
    
    guides.forEach((lg) => {
      switch (lg.snap) {
        case 'start':
        case 'center':
        case 'end': {
          switch (lg.orientation) {
            case 'V': {
              absPos.x = lg.lineGuide + lg.offset;
              console.log(`📍 Snapping X: ${originalPos.x} → ${absPos.x}`);
              break;
            }
            case 'H': {
              absPos.y = lg.lineGuide + lg.offset;
              console.log(`📍 Snapping Y: ${originalPos.y} → ${absPos.y}`);
              break;
            }
          }
          break;
        }
      }
    });
    
    target.absolutePosition(absPos);
  }, [getLineGuideStops, getObjectSnappingEdges, getGuides, drawGuides]);

  // Gérer la fin du drag
  const handleSnapDragEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    console.log('🏁 Snapping drag end - clearing guides');
    const target = e.target as Konva.Shape;
    const layer = target.getLayer();
    
    if (layer) {
      // ✅ Nettoyer toutes les lignes guides
      layer.find('.guide-line').forEach((l) => l.destroy());
      layer.draw();
    }
  }, []);

  return {
    handleSnapDragMove,
    handleSnapDragEnd,
  };
} 