import Konva from 'konva';

/**
 * Maintient le ratio d'aspect lors de la transformation d'un noeud Konva
 * @param node - Le noeud Konva en cours de transformation
 * @param originalRatio - Le ratio original (largeur/hauteur) à maintenir
 */
export function maintainAspectRatio(node: Konva.Node, originalRatio?: number): void {
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();
  
  // Calculer le ratio original si pas fourni
  let ratio = originalRatio;
  if (!ratio) {
    const width = (node as any).width?.() || (node as any).radius?.() * 2 || 100;
    const height = (node as any).height?.() || (node as any).radius?.() * 2 || 100;
    ratio = width / height;
  }

  // Utiliser la plus grande échelle pour maintenir le ratio
  const scale = Math.max(Math.abs(scaleX), Math.abs(scaleY));
  
  // Préserver le signe de l'échelle
  const newScaleX = scaleX >= 0 ? scale : -scale;
  const newScaleY = scaleY >= 0 ? scale : -scale;

  // Appliquer les nouvelles échelles
  node.scaleX(newScaleX);
  node.scaleY(newScaleY);
}

/**
 * Gère la transformation d'un noeud avec option de maintien du ratio
 * @param e - L'événement de transformation Konva
 * @param maintainRatio - Si true, maintient le ratio d'aspect
 * @param originalRatio - Le ratio original optionnel
 */
export function handleTransformWithRatio(
  e: Konva.KonvaEventObject<Event>,
  maintainRatio: boolean = false,
  originalRatio?: number
): void {
  const node = e.target;

  if (maintainRatio) {
    maintainAspectRatio(node, originalRatio);
  }

  // Pour les formes avec largeur/hauteur, appliquer les transformations
  if ('width' in node && 'height' in node) {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const newWidth = (node as any).width() * scaleX;
    const newHeight = (node as any).height() * scaleY;

    // Appliquer immédiatement les nouvelles dimensions
    node.setAttrs({
      width: newWidth,
      height: newHeight,
      scaleX: 1,
      scaleY: 1,
    });
  }
  // Pour les cercles
  else if ('radius' in node) {
    const circleNode = node as Konva.Circle;
    const scale = Math.max(Math.abs(circleNode.scaleX()), Math.abs(circleNode.scaleY()));
    const newRadius = circleNode.radius() * scale;

    circleNode.setAttrs({
      radius: newRadius,
      scaleX: 1,
      scaleY: 1,
    });
  }
}

/**
 * Crée un handler de transformation qui respecte l'état de Ctrl pour maintenir le ratio
 * @param isCtrlPressed - État de la touche Ctrl
 * @param originalRatio - Ratio original optionnel
 */
export const createTransformHandler = (
  handleTransformEnd: (
    e: Konva.KonvaEventObject<Event>,
    shapeId: string,
    className: string
  ) => Promise<void>,
  handleTransformContinuous: (
    e: Konva.KonvaEventObject<Event>,
    shapeId: string,
    className: string
  ) => Promise<void>,
  isCtrlPressed: boolean
) => {
  // ✅ Map pour gérer les timeouts par shape
  const transformTimeouts = new Map<string, NodeJS.Timeout>();
  
  return (node: Konva.Node, className: string) => {
    const shapeId = node.attrs.id as string;
    
    return {
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
        // ✅ Nettoyer le timeout de transformation continue s'il existe
        const existingTimeout = transformTimeouts.get(shapeId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          transformTimeouts.delete(shapeId);
        }
        
        // ✅ Sauvegarder définitivement à la fin de la transformation
        handleTransformEnd(e, shapeId, className);
      },
      onTransform: (e: Konva.KonvaEventObject<Event>) => {
        // ✅ Maintenir le ratio si Ctrl est pressé (instantané, pas de sauvegarde)
        if (isCtrlPressed && (className === "Rect" || className === "Image" || className === "Video")) {
          const scaleX = (node as any).scaleX();
          const scaleY = (node as any).scaleY();
          const scale = Math.abs(scaleX) > Math.abs(scaleY) ? scaleX : scaleY;
          (node as any).scaleX(scale);
          (node as any).scaleY(scale);
        }
        
        // ✅ Throttling amélioré : seulement sauvegarder après 300ms d'inactivité
        const existingTimeout = transformTimeouts.get(shapeId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }
        
        // ✅ Programmer une sauvegarde seulement si l'utilisateur arrête de transformer
        const timeout = setTimeout(() => {
          handleTransformContinuous(e, shapeId, className);
          transformTimeouts.delete(shapeId);
        }, 300); // ✅ Augmenté de 100ms à 300ms
        
        transformTimeouts.set(shapeId, timeout);
      },
    };
  };
}; 