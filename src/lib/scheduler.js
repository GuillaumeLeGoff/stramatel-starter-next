import cron from 'node-cron';
import { PrismaClient } from '../prisma/generated/client/index.js';

const prisma = new PrismaClient();

// Énumérations copiées depuis le schéma Prisma
const SecurityEventType = {
  ACCIDENT: 'ACCIDENT',
  ACCIDENT_WITH_STOP: 'ACCIDENT_WITH_STOP',
  ACCIDENT_WITHOUT_STOP: 'ACCIDENT_WITHOUT_STOP',
  MINOR_CARE: 'MINOR_CARE',
  NEAR_MISS: 'NEAR_MISS',
  DANGEROUS_SITUATION: 'DANGEROUS_SITUATION'
};

export class SecurityCronService {
  /**
   * Met à jour les compteurs de jours sans accident (appelé chaque jour à minuit)
   */
  static async updateDailyCounters() {
    try {
      console.log('Mise à jour des compteurs quotidiens de sécurité...');

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Vérifier s'il y a eu des accidents hier
      const accidentsYesterday = await prisma.securityEvent.findMany({
        where: {
          date: {
            gte: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
            lt: new Date(today.getFullYear(), today.getMonth(), today.getDate())
          },
          type: {
            in: [
              SecurityEventType.ACCIDENT,
              SecurityEventType.ACCIDENT_WITH_STOP,
              SecurityEventType.ACCIDENT_WITHOUT_STOP
            ]
          }
        }
      });

      // Récupérer les indicateurs actuels
      const indicators = await prisma.securityIndicators.findFirst({
        orderBy: { updatedAt: 'desc' }
      });

      if (!indicators) {
        // Créer les premiers indicateurs si ils n'existent pas
        await this.initializeIndicators();
        return;
      }

      // Si pas d'accident hier, incrémenter les compteurs
      if (accidentsYesterday.length === 0) {
        const newDaysWithoutAccident = indicators.currentDaysWithoutAccident + 1;

        // Vérifier si c'est un nouveau record
        let newRecord = indicators.recordDaysWithoutAccident;
        let newRecordDate = indicators.recordDaysWithoutAccidentDate;

        if (newDaysWithoutAccident > indicators.recordDaysWithoutAccident) {
          newRecord = newDaysWithoutAccident;
          newRecordDate = today;
        }

        // Mettre à jour les indicateurs
        await prisma.securityIndicators.update({
          where: { id: indicators.id },
          data: {
            currentDaysWithoutAccident: newDaysWithoutAccident,
            currentDaysWithoutAccidentWithStop: this.shouldIncrementWithStopCounter(accidentsYesterday)
              ? indicators.currentDaysWithoutAccidentWithStop + 1
              : indicators.currentDaysWithoutAccidentWithStop,
            currentDaysWithoutAccidentWithoutStop: this.shouldIncrementWithoutStopCounter(accidentsYesterday)
              ? indicators.currentDaysWithoutAccidentWithoutStop + 1
              : indicators.currentDaysWithoutAccidentWithoutStop,
            recordDaysWithoutAccident: newRecord,
            recordDaysWithoutAccidentDate: newRecordDate,
            updatedBy: 1 // Système
          }
        });

        console.log(`Compteurs mis à jour : ${newDaysWithoutAccident} jours sans accident`);
      } else {
        console.log(`Accident détecté hier, compteurs remis à zéro`);
      }

      // Mettre à jour les compteurs mensuels si nécessaire
      await this.updateMonthlyCountersIfNeeded();

    } catch (error) {
      console.error('Erreur lors de la mise à jour des compteurs quotidiens:', error);
      throw error;
    }
  }

  /**
   * Initialise les indicateurs pour la première fois
   */
  static async initializeIndicators() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // Calculer les jours sans accident depuis le dernier accident
    const lastAccident = await prisma.securityEvent.findFirst({
      where: {
        type: {
          in: [
            SecurityEventType.ACCIDENT,
            SecurityEventType.ACCIDENT_WITH_STOP,
            SecurityEventType.ACCIDENT_WITHOUT_STOP
          ]
        }
      },
      orderBy: { date: 'desc' }
    });

    const daysWithoutAccident = lastAccident
      ? Math.floor((today.getTime() - lastAccident.date.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    await prisma.securityIndicators.create({
      data: {
        currentDaysWithoutAccident: daysWithoutAccident,
        currentDaysWithoutAccidentWithStop: daysWithoutAccident,
        currentDaysWithoutAccidentWithoutStop: daysWithoutAccident,
        recordDaysWithoutAccident: daysWithoutAccident,
        recordStartDate: today,
        referenceYear: currentYear,
        referenceMonth: currentMonth,
        updatedBy: 1 // Système
      }
    });

    console.log('Indicateurs initialisés avec', daysWithoutAccident, 'jours sans accident');
  }

  /**
   * Vérifie si le compteur "avec arrêt" doit être incrémenté
   */
  static shouldIncrementWithStopCounter(accidentsYesterday) {
    return !accidentsYesterday.some(accident =>
      accident.type === SecurityEventType.ACCIDENT_WITH_STOP ||
      accident.type === SecurityEventType.ACCIDENT
    );
  }

  /**
   * Vérifie si le compteur "sans arrêt" doit être incrémenté
   */
  static shouldIncrementWithoutStopCounter(accidentsYesterday) {
    return !accidentsYesterday.some(accident =>
      accident.type === SecurityEventType.ACCIDENT_WITHOUT_STOP ||
      accident.type === SecurityEventType.ACCIDENT
    );
  }

  /**
   * Met à jour les compteurs mensuels si on a changé de mois
   */
  static async updateMonthlyCountersIfNeeded() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const indicators = await prisma.securityIndicators.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (!indicators) return;

    // Si on a changé de mois, remettre le compteur mensuel à zéro
    if (indicators.referenceMonth !== currentMonth || indicators.referenceYear !== currentYear) {
      const monthStart = new Date(currentYear, currentMonth - 1, 1);
      const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

      const monthlyAccidents = await prisma.securityEvent.count({
        where: {
          date: { gte: monthStart, lte: monthEnd },
          type: {
            in: [
              SecurityEventType.ACCIDENT,
              SecurityEventType.ACCIDENT_WITH_STOP,
              SecurityEventType.ACCIDENT_WITHOUT_STOP
            ]
          }
        }
      });

      await prisma.securityIndicators.update({
        where: { id: indicators.id },
        data: {
          monthlyAccidentsCount: monthlyAccidents,
          referenceMonth: currentMonth,
          referenceYear: currentYear
        }
      });

      console.log(`Compteurs mensuels mis à jour pour ${currentMonth}/${currentYear}`);
    }
  }
}

export class Scheduler {
  static isInitialized = false;

  /**
   * Initialise tous les cron jobs
   */
  static initialize() {
    if (this.isInitialized) {
      console.log('Scheduler déjà initialisé');
      return;
    }

    console.log('Initialisation du scheduler...');

    // Tâche quotidienne à minuit pour mettre à jour les compteurs de sécurité
    cron.schedule('0 0 * * *', async () => {
      console.log('Exécution de la tâche quotidienne de mise à jour des compteurs de sécurité');
      try {
        await SecurityCronService.updateDailyCounters();
        console.log('Tâche quotidienne terminée avec succès');
      } catch (error) {
        console.error('Erreur lors de la tâche quotidienne:', error);
      }
    }, {
      timezone: 'Europe/Paris'
    });

    // Tâche de test toutes les minutes (à supprimer en production)
    if (process.env.NODE_ENV === 'development') {
      cron.schedule('* * * * *', async () => {
        console.log('Test de l\'incrément des compteurs...');
        try {
          await SecurityCronService.updateDailyCounters();
        } catch (error) {
          console.error('Erreur lors du test:', error);
        }
      });
    }

    this.isInitialized = true;
    console.log('Scheduler initialisé avec succès');
  }

  /**
   * Exécute manuellement la mise à jour quotidienne (pour les tests)
   */
  static async runDailyUpdate() {
    console.log('Exécution manuelle de la mise à jour quotidienne...');
    try {
      await SecurityCronService.updateDailyCounters();
      console.log('Mise à jour quotidienne terminée avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour quotidienne:', error);
      throw error;
    }
  }
} 