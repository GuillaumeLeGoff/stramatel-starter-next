import { useCallback } from "react";
import { KonvaStage, KonvaShape } from "../../types";

type ExtendedKonvaShape = KonvaShape & {
  attrs: Record<string, unknown>;
};

interface UseKonvaSaveProps {
  stageData: KonvaStage | null;
  saveCurrentSlideKonvaData: (updatedKonvaData: KonvaStage, options?: { skipHistory?: boolean }) => Promise<void>;
}

// Type pour les données de sauvegarde - peut être un seul nœud ou plusieurs
type SaveData =
  | { nodeId: string; attrs: Record<string, unknown> } // Un seul nœud
  | Record<string, Record<string, unknown>>; // Plusieurs nœuds

export function useCanvasSave({
  stageData,
  saveCurrentSlideKonvaData,
}: UseKonvaSaveProps) {
  // Fonction unifiée pour sauvegarder un ou plusieurs nœuds
  const saveChanges = useCallback(
    async (data: SaveData, options?: { skipHistory?: boolean }) => {
      if (!stageData) return;

      const updatedStageData = JSON.parse(
        JSON.stringify(stageData)
      ) as KonvaStage;

      // Normaliser les données : toujours traiter comme un objet de nœuds multiples
      const updatedNodes: Record<string, Record<string, unknown>> = "nodeId" in
      data
        ? { [data.nodeId as string]: data.attrs } // Un seul nœud → convertir en format multiple
        : data; // Déjà au format multiple

      const updateNodesInTree = (nodes: ExtendedKonvaShape[]) => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];

          if (node.attrs?.id && updatedNodes[node.attrs.id as string]) {
            nodes[i] = {
              ...node,
              attrs: {
                ...node.attrs,
                ...updatedNodes[node.attrs.id as string],
              },
            } as ExtendedKonvaShape;
          }

          if (node.children && node.children.length > 0) {
            updateNodesInTree(node.children as ExtendedKonvaShape[]);
          }
        }
      };

      if (updatedStageData.children) {
        updateNodesInTree(updatedStageData.children as ExtendedKonvaShape[]);
      }

      await saveCurrentSlideKonvaData(updatedStageData, options);
    },
    [stageData, saveCurrentSlideKonvaData]
  );

  return {
    saveChanges, // Une seule fonction, simple et claire !
  };
}
