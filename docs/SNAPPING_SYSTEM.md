# Système de Snapping Konva

## 🎯 Overview

Le système de snapping permet aux objets de se "coller" automatiquement aux guides visuels lors du déplacement (drag and drop). Il facilite l'alignement précis des éléments dans l'éditeur.

## ✨ Fonctionnalités

### 🔄 Snapping automatique pendant le drag
- **Bords du stage** : Gauche, centre, droite et haut, centre, bas
- **Bords des objets** : Snapping entre les bords et centres de tous les objets
- **Guides visuels** : Lignes bleues pointillées qui apparaissent pendant le snapping

### 📐 Points de snapping
- **Start** : Bord gauche/haut d'un objet
- **Center** : Centre horizontal/vertical d'un objet  
- **End** : Bord droit/bas d'un objet

### ⚙️ Configuration
- **Distance de snapping** : 5 pixels (configurable via `GUIDELINE_OFFSET`)
- **Couleur des guides** : Bleu (`rgb(0, 161, 255)`)
- **Style des guides** : Lignes pointillées `[4, 6]`

## 🏗️ Architecture

### Hook principal : `useSnapping`
```typescript
const { handleSnapDragMove, handleSnapDragEnd, clearGuides } = useSnapping(stageRef);
```

### Fonctions clés

#### `getLineGuideStops(skipShape?: Konva.Node)`
Calcule tous les points de snapping disponibles :
- Bords et centre du stage
- Bords et centres de tous les objets (sauf celui déplacé)

#### `getObjectSnappingEdges(node: Konva.Node)`
Détermine les points de snapping de l'objet en mouvement :
- Bords gauche, centre, droite (vertical)
- Bords haut, centre, bas (horizontal)

#### `getGuides(lineGuideStops, itemBounds)`
Trouve les guides les plus proches et détermine si le snapping doit s'activer.

#### `drawGuides(guides: SnappingGuide[])`
Dessine les lignes guides visuelles sur le canvas.

## 🔧 Intégration

### Dans `useCanvasRenderer`
```typescript
// Hook de snapping
const { handleSnapDragMove, handleSnapDragEnd } = useSnapping(stageRef);

// Gestionnaire de drag move avec snapping
const handleDragMove = useCallback((e, shapeId) => {
  if (isPreview) return;
  handleSnapDragMove(e); // 🔥 Application du snapping
}, [isPreview, handleSnapDragMove]);

// Gestionnaire de fin de drag
const handleDragEnd = useCallback(async (e, shapeId) => {
  if (isPreview) return;
  handleSnapDragEnd(); // 🧹 Nettoyage des guides
  // ... sauvegarde
}, [isPreview, handleSnapDragEnd, saveHook.saveChanges]);
```

### Dans `KonvaStageRenderer`
```typescript
// Référence du stage pour le snapping
<Stage ref={registerStageRef} ...>

// Événement onDragMove sur toutes les formes
const commonProps = {
  onDragMove: isPreview ? undefined : (e) => handleDragMove(e, shapeId),
  // ... autres props
};
```

## 🎨 Comportement visuel

### Pendant le drag
1. **Détection** : Calcul des distances aux guides
2. **Seuil** : Si distance < 5px → Activation du snapping
3. **Guidage** : Affichage des lignes guides bleues
4. **Position** : Ajustement automatique de la position

### Fin du drag
1. **Nettoyage** : Suppression de toutes les lignes guides
2. **Sauvegarde** : Position finale enregistrée

## 🔍 Types et interfaces

```typescript
interface SnappingGuide {
  lineGuide: number;      // Position de la ligne guide
  offset: number;         // Décalage de l'objet
  orientation: 'V' | 'H'; // Vertical ou Horizontal
  snap: 'start' | 'center' | 'end';
}

interface SnappingEdge {
  guide: number;          // Position du guide
  offset: number;         // Décalage
  snap: 'start' | 'center' | 'end';
}
```

## 🚀 Optimisations

### Performance
- **Calcul optimisé** : Seulement pendant le drag actif
- **Guides réutilisables** : Références stockées pour destruction rapide
- **Pas d'écoute** : `listening: false` sur les guides pour éviter l'interception

### Mémoire
- **Nettoyage automatique** : Guides supprimés à chaque fin de drag
- **Références faibles** : Pas de fuites mémoire

## 🎯 Objets supportés

Le snapping fonctionne avec tous les objets draggables :
- ✅ **Formes de base** : Rectangle, Circle, Text, Line, Arrow
- ✅ **Composants personnalisés** : KonvaImage, KonvaVideo, KonvaLiveText
- ✅ **Groupes** : Group avec enfants
- ✅ **Transformations** : Rotation et scale préservés

## 📝 Notes d'implémentation

### Inspiré de l'exemple officiel Konva
Basé sur : [Objects Snapping - Konva.js](https://konvajs.org/docs/sandbox/Objects_Snapping.html)

### Adaptations spécifiques
- **React hooks** : Intégration avec les hooks React
- **TypeScript** : Typage complet
- **Composants modulaires** : Séparation des responsabilités
- **Store integration** : Compatible avec Zustand store

## 🐛 Debug

### Logs disponibles
```typescript
console.log('🔄 Drag move pour ${shapeId}:', { x, y });
```

### Vérifications
- Référence du stage : `stageRef.current` doit être définie
- Couches disponibles : `stage.getLayers()[0]` doit exister
- Formes détectées : Vérifier les sélecteurs `.object, Circle, Rect, Text, Image, Group`

## 🎨 Personnalisation

### Couleur des guides
```typescript
stroke: 'rgb(255, 0, 0)', // Rouge au lieu de bleu
```

### Distance de snapping
```typescript
const GUIDELINE_OFFSET = 10; // 10px au lieu de 5px
```

### Style des lignes
```typescript
dash: [2, 2], // Pointillés plus fins
strokeWidth: 2, // Lignes plus épaisses
``` 