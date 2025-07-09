"use client";

import { io, Socket } from "socket.io-client";

export interface MediaData {
  id: number;
  originalFileName: string;
  fileName: string;
  path: string;
  format: string;
  type: string;
  size: number;
  uploadedAt: string;
  updatedAt: string;
  thumbnailId?: number;
  slideId?: number;
}

export interface CurrentSlideData {
  scheduleId: number;
  scheduleTitle: string;
  slideshowId: number;
  slideshowName: string;
  slideId: number;
  slidePosition: number;
  slideDuration: number;
  konvaData: any;
  media: MediaData[];
  totalSlides: number;
  elapsedInSlide: number;
  remainingInSlide: number;
  
  // Nouvelles propriétés pour l'enchaînement
  currentSlideshowIndex: number;
  totalSlideshows: number;
  allSlideshows: Array<{
    id: number;
    title: string;
    slideshowName: string;
    duration: number;
  }>;
  totalElapsedSeconds: number;
  timeInCurrentSlideshow: number;

  // ✅ Dimensions appSettings depuis WebSocket
  dimensions: {
    width: number;
    height: number;
  };
}

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect() {
    if (typeof window === "undefined") return;

    if (!this.socket) {
      this.socket = io();
      
      this.socket.on("connect", () => {
        console.log("Connecté au serveur WebSocket");
      });

      this.socket.on("disconnect", (reason) => {
        console.log("Déconnecté du serveur WebSocket:", reason);
      });

      this.socket.on("currentSlide", (data: CurrentSlideData | null) => {
        this.emit("currentSlide", data);
      });

      this.socket.on("appSettingsUpdated", (data: any) => {
        this.emit("appSettingsUpdated", data);
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  requestCurrentSlide() {
    if (this.socket) {
      this.socket.emit("requestCurrentSlide");
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketClient = new SocketClient();

let socketClientForApis: any = null;

// Initialiser la connexion socket côté serveur (pour les APIs)
function getSocketClientForApis() {
  if (!socketClientForApis) {
    socketClientForApis = io(`http://localhost:3000`, {
      transports: ['websocket', 'polling']
    });
  }
  return socketClientForApis;
}

// Fonction pour notifier les changements de contenu
export function notifyContentChange(type: 'slide' | 'slideshow', id: number, slideshowId?: number) {
  try {
    const client = getSocketClientForApis();
    
    // Déclencher une vérification immédiate des changements
    client.emit("checkContentChanges");
    
    console.log(`Notification de changement: ${type} ${id}${slideshowId ? ` (slideshow ${slideshowId})` : ''}`);
  } catch (error) {
    console.error('Erreur lors de la notification de changement:', error);
  }
}



// Fonction pour fermer la connexion socket (utile pour les tests)
export function closeSocketConnection() {
  if (socketClientForApis) {
    socketClientForApis.close();
    socketClientForApis = null;
  }
} 