import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { PrismaClient } from "./prisma/generated/client/index.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const DEBUG_WEBSOCKET = process.env.DEBUG_WEBSOCKET === "true";
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

const prisma = new PrismaClient();

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
    
    console.log("🔍 Debug - Recherche événements:", {
      now: now.toISOString(),
      currentTime,
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString(),
      localDate: now.toLocaleDateString('fr-FR'),
      localTime: now.toLocaleTimeString('fr-FR')
    });

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
    
    console.log("📋 Debug - TOUS les événements en BDD:", allSchedules.length);
    allSchedules.forEach((schedule, index) => {
      console.log(`  ${index + 1}. "${schedule.title}" - Date: ${schedule.startDate.toISOString()} - Heure: ${schedule.startTime}-${schedule.endTime} - AllDay: ${schedule.allDay}`);
    });

    // Trouver les événements programmés pour aujourd'hui et l'heure actuelle
    const activeSchedules = await prisma.schedule.findMany({
      where: {
        AND: [
          {
            startDate: {
              gte: today,  // Début d'aujourd'hui
              lt: tomorrow // Avant demain
            }
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
    
    console.log("🔍 Debug - Événements trouvés:", activeSchedules.length);
    activeSchedules.forEach((schedule, index) => {
      console.log(`📅 Événement ${index + 1}:`, {
        id: schedule.id,
        title: schedule.title,
        startDate: schedule.startDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isRecurring: schedule.isRecurring,
        slideshowName: schedule.slideshow.name,
        slidesCount: schedule.slideshow.slides.length
      });
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

    console.log("⏱️ Debug - Temps écoulé total:", totalElapsedSeconds, "secondes");

    // Calculer la durée totale de chaque slideshow
    const slideshowDurations = validSchedules.map(schedule => {
      const slideshow = schedule.slideshow;
      if (!slideshow.slides || slideshow.slides.length === 0) return 0;
      return slideshow.slides.reduce((total, slide) => total + slide.duration, 0);
    });

    console.log("📊 Debug - Durées des slideshows:", slideshowDurations);

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

    console.log(`🎯 Debug - Slideshow actif: "${slideshow.name}" (${currentScheduleIndex + 1}/${validSchedules.length}) - Temps dans slideshow: ${timeInCurrentSlideshow}s`);

    // Calculer la durée totale d'un cycle complet du slideshow
    const cycleDuration = slideshow.slides.reduce((total, slide) => total + slide.duration, 0);
    
    if (cycleDuration === 0) {
      return null; // Aucune slide ou toutes les slides ont une durée de 0
    }

    // IMPORTANT: Calculer la position dans le cycle depuis le temps dans le slideshow
    const cyclePosition = timeInCurrentSlideshow % cycleDuration;
    
    console.log(`🔄 Debug - Cycle: durée=${cycleDuration}s, position=${cyclePosition}s`);

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
    
    // Debug des médias - maintenant currentSlide.media est toujours un tableau
    console.log(`🎬 Debug - Médias de la slide ${currentSlide.id}:`, {
      mediaCount: currentSlide.media ? currentSlide.media.length : 0,
      mediaIds: currentSlide.media ? currentSlide.media.map(m => m.id) : [],
      mediaTypes: currentSlide.media ? currentSlide.media.map(m => m.type) : []
    });
    
    // Calculer le temps écoulé dans la slide actuelle (basé sur la position dans le cycle)
    const slideStartTimeInCycle = slideshow.slides.slice(0, currentSlideIndex).reduce((acc, slide) => acc + slide.duration, 0);
    const elapsedInSlide = cyclePosition - slideStartTimeInCycle;
    const remainingInSlide = Math.max(0, currentSlide.duration - elapsedInSlide);
    
    console.log(`⏰ Debug - Slide temps: début=${slideStartTimeInCycle}s, écoulé=${elapsedInSlide.toFixed(1)}s, restant=${remainingInSlide.toFixed(1)}s, durée slide=${currentSlide.duration}s`);

    return {
      scheduleId: activeSchedule.id,
      scheduleTitle: activeSchedule.title,
      slideshowId: slideshow.id,
      slideshowName: slideshow.name,
      slideId: currentSlide.id,
      slidePosition: currentSlide.position,
      slideDuration: currentSlide.duration,
      konvaData: currentSlide.konvaData,
      media: currentSlide.media || [],
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
      timeInCurrentSlideshow: timeInCurrentSlideshow
    };

  } catch (error) {
    console.error('Erreur lors du calcul de la slide actuelle:', error);
    return null;
  }
}

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  let broadcastInterval;
  let lastSlideId = null; // Pour détecter les changements de slide

  io.on("connection", (socket) => {
    console.log("🔌 Client connecté:", socket.id, `(${io.engine.clientsCount} clients total)`);

    // Envoyer immédiatement la slide actuelle
    getCurrentSlide().then(slideData => {
      console.log("👋 Nouvelle connexion", socket.id, "- Envoi immédiat:", slideData ? 
        `Slide ${slideData.slidePosition + 1}/${slideData.totalSlides} du slideshow "${slideData.slideshowName}"` : 
        "Aucune slide programmée"
      );
      
      if (slideData) {
        console.log("📤 Envoi immédiat WebSocket:", {
          slideshow: slideData.slideshowName,
          slide: `${slideData.slidePosition + 1}/${slideData.totalSlides}`,
          elapsedInSlide: slideData.elapsedInSlide.toFixed(1),
          remainingInSlide: slideData.remainingInSlide.toFixed(1),
          slideDuration: slideData.slideDuration
        });
      }
      
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
            console.log("🔄 CHANGEMENT DE SLIDE détecté! Nouvelle slide:", slideData.slideId);
            console.log("📤 Envoi immédiat pour changement:", {
              slideshow: slideData.slideshowName,
              slide: `${slideData.slidePosition + 1}/${slideData.totalSlides}`,
              slideId: slideData.slideId,
              konvaData: slideData.konvaData ? "✅ Présent" : "❌ Absent",
              mediaCount: slideData.media ? slideData.media.length : 0,
              mediaPaths: slideData.media ? slideData.media.map(m => m.path) : []
            });
            
            // Log des données konvaData si présentes
            if (DEBUG_WEBSOCKET && slideData.konvaData) {
              console.log("🎨 KonvaData:", JSON.stringify(slideData.konvaData, null, 2));
            }
            
            // Envoyer seulement lors du changement
            io.emit("currentSlide", slideData);
          } else {
            console.log("❌ Plus de slide active");
            io.emit("currentSlide", null);
          }
        }
        // Pas d'envoi si pas de changement
      }, 1000); // Vérification toutes les secondes
    }

    socket.on("requestCurrentSlide", async () => {
      const slideData = await getCurrentSlide();
      console.log("🔄 Demande manuelle de slide actuelle par", socket.id, ":", slideData ? 
        `Slide ${slideData.slidePosition + 1}/${slideData.totalSlides} du slideshow "${slideData.slideshowName}"` : 
        "Aucune slide programmée"
      );
      
      if (slideData) {
        console.log("📤 Envoi manuel WebSocket:", {
          slideshow: slideData.slideshowName,
          slide: `${slideData.slidePosition + 1}/${slideData.totalSlides}`,
          elapsedInSlide: slideData.elapsedInSlide.toFixed(1),
          remainingInSlide: slideData.remainingInSlide.toFixed(1),
          slideDuration: slideData.slideDuration
        });
      }
      
      socket.emit("currentSlide", slideData);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Client déconnecté:", socket.id, reason, `(${io.engine.clientsCount - 1} clients restants)`);
      
      // Arrêter la diffusion si plus de clients connectés
      if (io.engine.clientsCount === 0 && broadcastInterval) {
        console.log("⏹️ Arrêt de la diffusion - plus de clients connectés");
        clearInterval(broadcastInterval);
        broadcastInterval = null;
      }
    });
  });

  // Nettoyage à la fermeture du serveur
  process.on('SIGTERM', () => {
    if (broadcastInterval) {
      clearInterval(broadcastInterval);
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
      console.log(`> WebSocket Socket.IO disponible`);
    });
}); 