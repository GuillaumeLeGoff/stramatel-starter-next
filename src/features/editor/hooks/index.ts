// ===== EXPORTS PRINCIPAUX =====

// Export des hooks de l'éditeur
export * from "./editor";

// Export des hooks du canvas
export * from "./canvas";

// Export des hooks des formes
export * from "./shape";

// Export des hooks de gestion des slides
export * from "./slide";

// ===== HOOKS OPTIMISÉS AVEC ZUSTAND =====

// Store principal
export { useEditorStore, editorSelectors } from '../store/editorStore';

// Hooks spécialisés optimisés
export { useHeaderShapeEditor } from './editor/useHeaderShapeEditor';
export { useShapeMediaManager } from './shape/useShapeMediaManager';

// ===== ALIAS POUR LA COMPATIBILITÉ =====

// Anciens noms -> Nouveaux noms pour éviter les breaking changes
export { useEditorCore as useEditor } from "./editor/useEditorCore";
export { useEditorZoom as useZoom } from "./editor/useEditorZoom";
export { useSlideManager as useSlide } from "./slide/useSlideManager";
export { useShapeMedia as useMedias } from "./shape/useShapeMedia";
export { useShapeTextEditor as useTextEditor } from "./shape/useShapeTextEditor";
export { useCanvasSave as useKonvaSave } from "./canvas/useCanvasSave";
export { useCanvasRenderer as useKonvaStageRenderer } from "./canvas/useCanvasRenderer";

// Export direct pour éviter les dépendances circulaires
export { useEditorPage } from './editor/useEditorPage';

// ===== TYPES =====

export type * from '../types';


