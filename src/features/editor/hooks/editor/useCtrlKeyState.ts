import { useState, useEffect } from 'react';

/**
 * Hook pour détecter l'état de la touche Ctrl
 * Retourne true quand Ctrl est enfoncé, false sinon
 */
export function useCtrlKeyState(): boolean {
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        setIsCtrlPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        setIsCtrlPressed(false);
      }
    };

    // Ajouter les écouteurs d'événements
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Gérer la perte de focus (pour éviter que Ctrl reste "enfoncé")
    const handleBlur = () => {
      setIsCtrlPressed(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsCtrlPressed(false);
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Nettoyer les écouteurs
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isCtrlPressed;
} 