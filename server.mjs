import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { PrismaClient } from "./prisma/generated/client/index.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

const prisma = new PrismaClient();

// Variables globales pour le cache et la détection des changements
let slidesCache = new Map(); // Cache des slides avec leur updatedAt
let slideshowsCache = new Map(); // Cache des slideshows avec leur updatedAt
let securityEventsCache = new Map(); // Cache des événements de sécurité avec leur updatedAt
let securityIndicatorsCache = new Map(); // Cache des indicateurs de sécurité avec leur updatedAt
let appSettingsCache = new Map(); // Cache des paramètres d'application avec leur updatedAt
let contentCheckInterval; // Intervalle pour vérifier les changements de contenu

// Fonction pour initialiser les caches
async function initializeCaches() {
  try {
    // Initialiser le cache des slides
    const slides = await prisma.slide.findMany({
      select: {
        id: true,
        updatedAt: true,
        slideshowId: true
      }
    });

    slides.forEach(slide => {
      slidesCache.set(slide.id, {
        updatedAt: slide.updatedAt,
        slideshowId: slide.slideshowId
      });
    });

    // Initialiser le cache des slideshows
    const slideshows = await prisma.slideshow.findMany({
      select: {
        id: true,
        updatedAt: true
      }
    });

    slideshows.forEach(slideshow => {
      slideshowsCache.set(slideshow.id, {
        updatedAt: slideshow.updatedAt
      });
    });

    // Initialiser le cache des événements de sécurité
    const securityEvents = await prisma.securityEvent.findMany({
      select: {
        id: true,
        updatedAt: true
      }
    });

    securityEvents.forEach(event => {
      securityEventsCache.set(event.id, {
        updatedAt: event.updatedAt
      });
    });

    // Initialiser le cache des indicateurs de sécurité
    const securityIndicators = await prisma.securityIndicators.findMany({
      select: {
        id: true,
        updatedAt: true
      }
    });

    securityIndicators.forEach(indicator => {
      securityIndicatorsCache.set(indicator.id, {
        updatedAt: indicator.updatedAt
      });
    });

    // Initialiser le cache des paramètres d'application
    const appSettings = await prisma.appSettings.findMany({
      select: {
        id: true,
        updatedAt: true,
        width: true,
        height: true
      }
    });

    appSettings.forEach(settings => {
      appSettingsCache.set(settings.id, {
        updatedAt: settings.updatedAt,
        width: settings.width,
        height: settings.height
      });
    });

    console.log(`Cache initialisé: ${slides.length} slides, ${slideshows.length} slideshows, ${securityEvents.length} événements de sécurité, ${securityIndicators.length} indicateurs de sécurité, ${appSettings.length} paramètres d'application`);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des caches:', error);
  }
}

// Fonction pour vérifier les changements de contenu
async function checkContentChanges(io) {
  try {
    let hasChanges = false;
    let affectedSlideshowIds = new Set();

    // Vérifier les changements de slides
    const currentSlides = await prisma.slide.findMany({
      select: {
        id: true,
        updatedAt: true,
        slideshowId: true
      }
    });

    // Détecter les slides nouvelles ou modifiées
    for (const slide of currentSlides) {
      const cached = slidesCache.get(slide.id);
      if (!cached || cached.updatedAt.getTime() !== slide.updatedAt.getTime()) {
        hasChanges = true;
        affectedSlideshowIds.add(slide.slideshowId);
        slidesCache.set(slide.id, {
          updatedAt: slide.updatedAt,
          slideshowId: slide.slideshowId
        });
        console.log(`Slide ${slide.id} modifiée dans slideshow ${slide.slideshowId}`);
      }
    }

    // Détecter les slides supprimées
    const currentSlideIds = new Set(currentSlides.map(s => s.id));
    for (const [slideId, cached] of slidesCache) {
      if (!currentSlideIds.has(slideId)) {
        hasChanges = true;
        affectedSlideshowIds.add(cached.slideshowId);
        slidesCache.delete(slideId);
        console.log(`Slide ${slideId} supprimée du slideshow ${cached.slideshowId}`);
      }
    }

    // Vérifier les changements de slideshows
    const currentSlideshows = await prisma.slideshow.findMany({
      select: {
        id: true,
        updatedAt: true
      }
    });

    // Détecter les slideshows nouveaux ou modifiés
    for (const slideshow of currentSlideshows) {
      const cached = slideshowsCache.get(slideshow.id);
      if (!cached || cached.updatedAt.getTime() !== slideshow.updatedAt.getTime()) {
        hasChanges = true;
        affectedSlideshowIds.add(slideshow.id);
        slideshowsCache.set(slideshow.id, {
          updatedAt: slideshow.updatedAt
        });
        console.log(`Slideshow ${slideshow.id} modifié`);
      }
    }

    // Détecter les slideshows supprimés
    const currentSlideshowIds = new Set(currentSlideshows.map(s => s.id));
    for (const [slideshowId] of slideshowsCache) {
      if (!currentSlideshowIds.has(slideshowId)) {
        hasChanges = true;
        slideshowsCache.delete(slideshowId);
        console.log(`Slideshow ${slideshowId} supprimé`);
      }
    }

    // Vérifier les changements des événements de sécurité
    const currentSecurityEvents = await prisma.securityEvent.findMany({
      select: {
        id: true,
        updatedAt: true
      }
    });

    // Détecter les événements de sécurité nouveaux ou modifiés
    for (const event of currentSecurityEvents) {
      const cached = securityEventsCache.get(event.id);
      if (!cached || cached.updatedAt.getTime() !== event.updatedAt.getTime()) {
        hasChanges = true;
        securityEventsCache.set(event.id, {
          updatedAt: event.updatedAt
        });
        console.log(`Événement de sécurité ${event.id} modifié`);
      }
    }

    // Détecter les événements de sécurité supprimés
    const currentSecurityEventIds = new Set(currentSecurityEvents.map(e => e.id));
    for (const [eventId] of securityEventsCache) {
      if (!currentSecurityEventIds.has(eventId)) {
        hasChanges = true;
        securityEventsCache.delete(eventId);
        console.log(`Événement de sécurité ${eventId} supprimé`);
      }
    }

    // Vérifier les changements des indicateurs de sécurité
    const currentSecurityIndicators = await prisma.securityIndicators.findMany({
      select: {
        id: true,
        updatedAt: true
      }
    });

    // Détecter les indicateurs de sécurité nouveaux ou modifiés
    for (const indicator of currentSecurityIndicators) {
      const cached = securityIndicatorsCache.get(indicator.id);
      if (!cached || cached.updatedAt.getTime() !== indicator.updatedAt.getTime()) {
        hasChanges = true;
        securityIndicatorsCache.set(indicator.id, {
          updatedAt: indicator.updatedAt
        });
        console.log(`Indicateur de sécurité ${indicator.id} modifié`);
      }
    }

    // Détecter les indicateurs de sécurité supprimés
    const currentSecurityIndicatorIds = new Set(currentSecurityIndicators.map(i => i.id));
    for (const [indicatorId] of securityIndicatorsCache) {
      if (!currentSecurityIndicatorIds.has(indicatorId)) {
        hasChanges = true;
        securityIndicatorsCache.delete(indicatorId);
        console.log(`Indicateur de sécurité ${indicatorId} supprimé`);
      }
    }

    // Vérifier les changements des paramètres d'application (width/height)
    let appSettingsChanged = false;
    const currentAppSettings = await prisma.appSettings.findMany({
      select: {
        id: true,
        updatedAt: true,
        width: true,
        height: true
      }
    });

    // Détecter les paramètres d'application nouveaux ou modifiés
    for (const settings of currentAppSettings) {
      const cached = appSettingsCache.get(settings.id);
      if (!cached || 
          cached.updatedAt.getTime() !== settings.updatedAt.getTime() ||
          cached.width !== settings.width ||
          cached.height !== settings.height) {
        appSettingsChanged = true;
        appSettingsCache.set(settings.id, {
          updatedAt: settings.updatedAt,
          width: settings.width,
          height: settings.height
        });
        console.log(`Paramètres d'application ${settings.id} modifiés - dimensions: ${settings.width}x${settings.height}`);
      }
    }

    // Détecter les paramètres d'application supprimés
    const currentAppSettingsIds = new Set(currentAppSettings.map(s => s.id));
    for (const [settingsId] of appSettingsCache) {
      if (!currentAppSettingsIds.has(settingsId)) {
        appSettingsChanged = true;
        appSettingsCache.delete(settingsId);
        console.log(`Paramètres d'application ${settingsId} supprimés`);
      }
    }

    // Si des changements sont détectés, recalculer et diffuser la slide actuelle
    if (hasChanges) {
      console.log(`Changements détectés, slideshows affectés: ${Array.from(affectedSlideshowIds).join(', ')}`);
      const slideData = await getCurrentSlide();
      io.emit("currentSlide", slideData);
      io.emit("contentUpdated", {
        timestamp: new Date(),
        affectedSlideshows: Array.from(affectedSlideshowIds)
      });
      io.emit("securityDataUpdated", {
        timestamp: new Date(),
        eventsCount: currentSecurityEvents.length,
        indicatorsCount: currentSecurityIndicators.length
      });
    }

    // Émettre un événement spécifique pour les changements de dimensions
    if (appSettingsChanged) {
      const latestSettings = currentAppSettings[0]; // On assume qu'il n'y a qu'un seul AppSettings
      io.emit("appSettingsUpdated", {
        timestamp: new Date(),
        width: latestSettings?.width || 1920,
        height: latestSettings?.height || 1080,
        settings: latestSettings
      });
      console.log(`Dimensions mises à jour: ${latestSettings?.width || 1920}x${latestSettings?.height || 1080}`);
      
      // ✅ IMMÉDIATEMENT recalculer et envoyer currentSlide avec les nouvelles dimensions
      console.log("🔄 Recalcul immédiat de currentSlide avec nouvelles dimensions...");
      const slideData = await getCurrentSlide();
      io.emit("currentSlide", slideData);
      console.log("📡 currentSlide mis à jour immédiatement avec nouvelles dimensions");
    }

  } catch (error) {
    console.error('Erreur lors de la vérification des changements:', error);
  }
}

// Fonction pour calculer la slide actuelle
async function getCurrentSlide() {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // Format HH:mm

    // Calculer la date d'aujourd'hui en UTC pour correspondre à la BDD
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Début de la journée en UTC

    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1); // Fin de la journée

    // D'abord, voir TOUS les événements dans la BDD
    const allSchedules = await prisma.schedule.findMany({
      include: {
        slideshow: {
          include: {
            slides: true
          }
        }
      }
    });

    // Trouver les événements programmés pour aujourd'hui et l'heure actuelle
    // Pour les événements récurrents, on ne filtre PAS par startDate car elle peut être dans le passé
    const activeSchedules = await prisma.schedule.findMany({
      where: {
        AND: [
          {
            OR: [
              // Événements non-récurrents d'aujourd'hui
              {
                AND: [
                  { isRecurring: false },
                  {
                    startDate: {
                      gte: today,
                      lt: tomorrow
                    }
                  }
                ]
              },
              // Événements récurrents (sans filtrage de date)
              {
                isRecurring: true
              }
            ]
          },
          {
            allDay: false
          },
          {
            startTime: { lte: currentTime }
          },
          {
            OR: [
              { endTime: null },
              { endTime: { gt: currentTime } }
            ]
          }
        ]
      },
      include: {
        slideshow: {
          include: {
            slides: {
              orderBy: { position: 'asc' },
              include: {
                media: true
              }
            }
          }
        },
        recurrence: true
      }
    });

    // Filtrer les événements récurrents
    const validSchedules = activeSchedules.filter(schedule => {
      if (!schedule.isRecurring) {
        return true;
      }

      if (!schedule.recurrence) {
        return false;
      }

      const dayOfWeek = now.getDay(); // 0 = dimanche, 1 = lundi, etc.

      switch (schedule.recurrence.type) {
        case 'DAILY':
          return true;
        case 'WEEKLY':
          if (schedule.recurrence.daysOfWeek) {
            try {
              const allowedDays = JSON.parse(schedule.recurrence.daysOfWeek);
              return allowedDays.includes(dayOfWeek);
            } catch {
              return false;
            }
          }
          return true;
        case 'MONTHLY':
          // Simplification : tous les mois au même jour
          return now.getDate() === new Date(schedule.startDate).getDate();
        case 'YEARLY':
          // Simplification : tous les ans à la même date
          return now.getDate() === new Date(schedule.startDate).getDate() &&
            now.getMonth() === new Date(schedule.startDate).getMonth();
        default:
          return false;
      }
    });

    if (validSchedules.length === 0) {
      return null;
    }

    // Calculer le temps total écoulé depuis le début du premier événement
    const firstSchedule = validSchedules[0];
    const startTime = firstSchedule.startTime.split(':');
    const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const totalElapsedSeconds = (nowMinutes - startMinutes) * 60 + now.getSeconds();

    // Calculer la durée totale de chaque slideshow
    const slideshowDurations = validSchedules.map(schedule => {
      const slideshow = schedule.slideshow;
      if (!slideshow.slides || slideshow.slides.length === 0) return 0;
      return slideshow.slides.reduce((total, slide) => total + slide.duration, 0);
    });
    // Trouver dans quel slideshow et quelle slide nous sommes
    let accumulatedTime = 0;
    let currentScheduleIndex = 0;
    let timeInCurrentSlideshow = totalElapsedSeconds;

    // Si plusieurs événements, les enchaîner
    for (let i = 0; i < validSchedules.length; i++) {
      const duration = slideshowDurations[i];
      if (duration === 0) continue; // Ignorer les slideshows vides

      if (totalElapsedSeconds >= accumulatedTime && totalElapsedSeconds < accumulatedTime + duration) {
        currentScheduleIndex = i;
        timeInCurrentSlideshow = totalElapsedSeconds - accumulatedTime;
        break;
      }
      accumulatedTime += duration;

      // Si on a dépassé tous les slideshows, recommencer en boucle
      if (i === validSchedules.length - 1) {
        const totalCycleDuration = accumulatedTime + duration;
        const cyclePosition = totalElapsedSeconds % totalCycleDuration;

        // Refaire le calcul avec la position dans le cycle
        accumulatedTime = 0;
        for (let j = 0; j < validSchedules.length; j++) {
          const cycleDuration = slideshowDurations[j];
          if (cycleDuration === 0) continue;

          if (cyclePosition >= accumulatedTime && cyclePosition < accumulatedTime + cycleDuration) {
            currentScheduleIndex = j;
            timeInCurrentSlideshow = cyclePosition - accumulatedTime;
            break;
          }
          accumulatedTime += cycleDuration;
        }
        break;
      }
    }

    const activeSchedule = validSchedules[currentScheduleIndex];
    const slideshow = activeSchedule.slideshow;

    if (!slideshow.slides || slideshow.slides.length === 0) {
      return null;
    }
    // Calculer la durée totale d'un cycle complet du slideshow
    const cycleDuration = slideshow.slides.reduce((total, slide) => total + slide.duration, 0);

    if (cycleDuration === 0) {
      return null; // Aucune slide ou toutes les slides ont une durée de 0
    }

    // IMPORTANT: Calculer la position dans le cycle depuis le temps dans le slideshow
    const cyclePosition = timeInCurrentSlideshow % cycleDuration;

    // Trouver la slide actuelle dans le cycle
    let slideAccumulatedTime = 0;
    let currentSlideIndex = 0;

    for (let i = 0; i < slideshow.slides.length; i++) {
      const slide = slideshow.slides[i];
      if (cyclePosition >= slideAccumulatedTime && cyclePosition < slideAccumulatedTime + slide.duration) {
        currentSlideIndex = i;
        break;
      }
      slideAccumulatedTime += slide.duration;
    }

    const currentSlide = slideshow.slides[currentSlideIndex];

    // Sécuriser l'accès au tableau media
    const safeMedia = Array.isArray(currentSlide.media) ? currentSlide.media : [];

    // Calculer le temps écoulé dans la slide actuelle (basé sur la position dans le cycle)
    const slideStartTimeInCycle = slideshow.slides.slice(0, currentSlideIndex).reduce((acc, slide) => acc + slide.duration, 0);
    const elapsedInSlide = cyclePosition - slideStartTimeInCycle;
    const remainingInSlide = Math.max(0, currentSlide.duration - elapsedInSlide);

    // ✅ Récupérer les dimensions depuis appSettingsCache
    const latestSettings = Array.from(appSettingsCache.values())[0];
    const dimensions = {
      width: latestSettings?.width || 1920,
      height: latestSettings?.height || 1080
    };

    return {
      scheduleId: activeSchedule.id,
      scheduleTitle: activeSchedule.title,
      slideshowId: slideshow.id,
      slideshowName: slideshow.name,
      slideId: currentSlide.id,
      slidePosition: currentSlide.position,
      slideDuration: currentSlide.duration,
      konvaData: currentSlide.konvaData,
      media: safeMedia,
      totalSlides: slideshow.slides.length,
      elapsedInSlide: Math.max(0, elapsedInSlide),
      remainingInSlide: Math.max(0, remainingInSlide),

      // Informations sur l'enchaînement
      currentSlideshowIndex: currentScheduleIndex,
      totalSlideshows: validSchedules.length,
      allSlideshows: validSchedules.map(s => ({
        id: s.id,
        title: s.title,
        slideshowName: s.slideshow.name,
        duration: s.slideshow.slides.reduce((total, slide) => total + slide.duration, 0)
      })),
      totalElapsedSeconds: totalElapsedSeconds,
      timeInCurrentSlideshow: timeInCurrentSlideshow,

      // ✅ Dimensions appSettings
      dimensions: dimensions
    };

  } catch (error) {
    console.error('Erreur lors du calcul de la slide actuelle:', error);
    return null;
  }
}

app.prepare().then(async () => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Initialiser les caches au démarrage
  await initializeCaches();

  let broadcastInterval;
  let lastSlideId = null; // Pour détecter les changements de slide

  io.on("connection", (socket) => {
    // Envoyer immédiatement la slide actuelle
    getCurrentSlide().then(slideData => {
      socket.emit("currentSlide", slideData);
    });

    // Démarrer la vérification périodique des changements de slide
    if (!broadcastInterval) {
      broadcastInterval = setInterval(async () => {
        const slideData = await getCurrentSlide();

        // Détecter changement de slide
        const currentSlideId = slideData ? slideData.slideId : null;
        const slideChanged = lastSlideId !== currentSlideId;

        if (slideChanged) {
          lastSlideId = currentSlideId;

          if (slideData) {
            // Envoyer seulement lors du changement
            io.emit("currentSlide", slideData);
          } else {
            io.emit("currentSlide", null);
          }
        }
        // Pas d'envoi si pas de changement
      }, 1000); // Vérification toutes les secondes
    }

    // Démarrer la vérification périodique des changements de contenu
    if (!contentCheckInterval) {
      contentCheckInterval = setInterval(async () => {
        await checkContentChanges(io);
      }, 2000); // Vérification toutes les 2 secondes pour les changements de contenu
    }

    socket.on("requestCurrentSlide", async () => {
      const slideData = await getCurrentSlide();
      socket.emit("currentSlide", slideData);
    });

    // Nouveau événement pour forcer la vérification des changements de contenu
    socket.on("checkContentChanges", async () => {
      console.log("Vérification forcée des changements de contenu demandée");
      await checkContentChanges(io);
    });

    // Nouveau événement pour demander le statut des caches
    socket.on("getCacheStatus", () => {
      socket.emit("cacheStatus", {
        slidesCount: slidesCache.size,
        slideshowsCount: slideshowsCache.size,
        securityEventsCount: securityEventsCache.size,
        securityIndicatorsCount: securityIndicatorsCache.size,
        appSettingsCount: appSettingsCache.size,
        timestamp: new Date()
      });
    });

    // Nouveau événement pour demander les dimensions actuelles
    socket.on("getCurrentDimensions", () => {
      const latestSettings = Array.from(appSettingsCache.values())[0];
      socket.emit("currentDimensions", {
        width: latestSettings?.width || 1920,
        height: latestSettings?.height || 1080,
        timestamp: new Date()
      });
    });

    socket.on("disconnect", (reason) => {
      // Arrêter la diffusion si plus de clients connectés
      if (io.engine.clientsCount === 0) {
        if (broadcastInterval) {
          clearInterval(broadcastInterval);
          broadcastInterval = null;
        }
        if (contentCheckInterval) {
          clearInterval(contentCheckInterval);
          contentCheckInterval = null;
        }
      }
    });
  });

  // Nettoyage à la fermeture du serveur
  process.on('SIGTERM', () => {
    if (broadcastInterval) {
      clearInterval(broadcastInterval);
    }
    if (contentCheckInterval) {
      clearInterval(contentCheckInterval);
    }
    prisma.$disconnect();
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Serveur prêt sur http://${hostname}:${port}`);
    });
}); 