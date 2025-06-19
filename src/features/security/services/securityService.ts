import { PrismaClient } from '../../../../prisma/generated/client';
import { SecuritySeverity } from '../types';

const prisma = new PrismaClient();

export interface SecurityEventData {
  date: Date;
  description?: string;
  location?: string;
  severity?: SecuritySeverity;
  withWorkStop?: boolean;
  isReference?: boolean;
  createdBy: number;
}

export interface SecurityDigitalIndicators {
  // Date et heure actuelles
  currentDate: Date;
  currentTime: string;
  
  // Compteurs de jours sans accident
  daysWithoutAccident: number;
  daysWithoutAccidentWithStop: number;
  daysWithoutAccidentWithoutStop: number;
  
  // Records
  recordDaysWithoutAccident: number;
  lastAccidentDate: Date | null;
  
  // Compteurs annuels
  currentYearAccidents: number;
  currentYearAccidentsWithStop: number;
  currentYearAccidentsWithoutStop: number;
  currentYearMinorCare: number;
  currentYearNearMiss: number;
  currentYearDangerousSituations: number;
  
  // Compteurs mensuels
  currentMonthAccidents: number;
  
  // Compteurs sur période personnalisée
  accidentsLastXDays: (days: number) => Promise<number>;
}

export class SecurityService {
  /**
   * Créer un nouvel événement de sécurité
   */
  static async createSecurityEvent(eventData: SecurityEventData) {
    try {
      // Créer l'événement
      const event = await prisma.securityEvent.create({
        data: eventData,
        include: {
          user: true
        }
      });

      // Mettre à jour les indicateurs immédiatement après création
      await this.updateSecurityIndicators(eventData.createdBy);

      return event;
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement de sécurité:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les indicateurs digitaux actuels
   */
  static async getDigitalIndicators(): Promise<SecurityDigitalIndicators> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Récupérer les indicateurs depuis la base
    const indicators = await prisma.securityIndicators.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (!indicators) {
      // Initialiser si pas d'indicateurs
      await this.initializeIndicators(1); // userId système
      return this.getDigitalIndicators();
    }

    return {
      currentDate: now,
      currentTime: now.toLocaleTimeString('fr-FR'),
      daysWithoutAccident: indicators.currentDaysWithoutAccident,
      daysWithoutAccidentWithStop: indicators.currentDaysWithoutAccidentWithStop,
      daysWithoutAccidentWithoutStop: indicators.currentDaysWithoutAccidentWithoutStop,
      recordDaysWithoutAccident: indicators.recordDaysWithoutAccident,
      lastAccidentDate: indicators.lastAccidentDate,
      currentYearAccidents: indicators.yearlyAccidentsCount,
      currentYearAccidentsWithStop: indicators.yearlyAccidentsWithStopCount,
      currentYearAccidentsWithoutStop: indicators.yearlyAccidentsWithoutStopCount,
      currentYearMinorCare: indicators.yearlyMinorCareCount,
      currentYearNearMiss: indicators.yearlyNearMissCount,
      currentYearDangerousSituations: indicators.yearlyDangerousSituationCount,
      currentMonthAccidents: indicators.monthlyAccidentsCount,
      accidentsLastXDays: (days: number) => this.getAccidentsLastXDays(days)
    };
  }

  /**
   * Calculer le nombre d'accidents sur les X derniers jours
   */
  static async getAccidentsLastXDays(days: number): Promise<number> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await prisma.securityEvent.count({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        isReference: false
      }
    });
  }

  /**
   * Mettre à jour tous les indicateurs de sécurité
   */
  static async updateSecurityIndicators(updatedBy: number) {
    try {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      // Calculer tous les compteurs
      const counters = await this.calculateAllCounters(currentYear, currentMonth);

      // Récupérer les indicateurs actuels ou créer s'ils n'existent pas
      const existingIndicators = await prisma.securityIndicators.findFirst({
        orderBy: { updatedAt: 'desc' }
      });

      if (existingIndicators) {
        // Mettre à jour les indicateurs existants
        await prisma.securityIndicators.update({
          where: { id: existingIndicators.id },
          data: {
            ...counters,
            referenceYear: currentYear,
            referenceMonth: currentMonth,
            updatedBy
          }
        });
      } else {
        // Créer de nouveaux indicateurs
        await prisma.securityIndicators.create({
          data: {
            ...counters,
            referenceYear: currentYear,
            referenceMonth: currentMonth,
            updatedBy
          }
        });
      }

      console.log('Indicateurs de sécurité mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des indicateurs:', error);
      throw error;
    }
  }

  /**
   * Calculer tous les compteurs nécessaires
   */
  private static async calculateAllCounters(year: number, month: number) {
    const today = new Date();

    // Trouver le dernier accident
    const lastAccident = await this.getLastEvent();

    const lastAccidentWithStop = await this.getLastEventWithStop();

    const lastAccidentWithoutStop = await this.getLastEventWithoutStop();

    // Calculer les jours sans accident
    let daysWithoutAccident = 0;
    if (lastAccident) {
      daysWithoutAccident = Math.floor((today.getTime() - lastAccident.date.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      // Aucun accident : calculer depuis la date de début de suivi
      const indicators = await prisma.securityIndicators.findFirst({ orderBy: { updatedAt: 'desc' }, select: { monitoringStartDate: true } });
      if (indicators?.monitoringStartDate) {
        daysWithoutAccident = Math.floor((today.getTime() - indicators.monitoringStartDate.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        daysWithoutAccident = 0;
      }
    }

    let daysWithoutAccidentWithStop = 0;
    if (lastAccidentWithStop) {
      daysWithoutAccidentWithStop = Math.floor((today.getTime() - lastAccidentWithStop.date.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      const indicators = await prisma.securityIndicators.findFirst({ orderBy: { updatedAt: 'desc' }, select: { monitoringStartDate: true } });
      if (indicators?.monitoringStartDate) {
        daysWithoutAccidentWithStop = Math.floor((today.getTime() - indicators.monitoringStartDate.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        daysWithoutAccidentWithStop = 0;
      }
    }

    let daysWithoutAccidentWithoutStop = 0;
    if (lastAccidentWithoutStop) {
      daysWithoutAccidentWithoutStop = Math.floor((today.getTime() - lastAccidentWithoutStop.date.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      const indicators = await prisma.securityIndicators.findFirst({ orderBy: { updatedAt: 'desc' }, select: { monitoringStartDate: true } });
      if (indicators?.monitoringStartDate) {
        daysWithoutAccidentWithoutStop = Math.floor((today.getTime() - indicators.monitoringStartDate.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        daysWithoutAccidentWithoutStop = 0;
      }
    }

    // Calculer le record en analysant l'historique complet
    const { record: recordDaysWithoutAccident, recordDate: recordDaysWithoutAccidentDate } = 
      await this.calculateRecordDaysWithoutAccident();

    // Compteurs annuels
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    const yearlyCounters = await this.getEventCountsByPeriod(yearStart, yearEnd);

    // Compteurs mensuels
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const monthlyAccidents = await prisma.securityEvent.count({
      where: {
        date: { gte: monthStart, lte: monthEnd },
        isReference: false
      }
    });

    return {
      lastAccidentDate: lastAccident?.date || null,
      lastAccidentWithStopDate: lastAccidentWithStop?.date || null,
      lastAccidentWithoutStopDate: lastAccidentWithoutStop?.date || null,
      recordStartDate: today,
      currentDaysWithoutAccident: daysWithoutAccident,
      currentDaysWithoutAccidentWithStop: daysWithoutAccidentWithStop,
      currentDaysWithoutAccidentWithoutStop: daysWithoutAccidentWithoutStop,
      recordDaysWithoutAccident,
      recordDaysWithoutAccidentDate,
      yearlyAccidentsCount: yearlyCounters.accidents,
      yearlyAccidentsWithStopCount: yearlyCounters.accidentsWithStop,
      yearlyAccidentsWithoutStopCount: yearlyCounters.accidentsWithoutStop,
      yearlyMinorCareCount: 0,
      yearlyNearMissCount: 0,
      yearlyDangerousSituationCount: 0,
      monthlyAccidentsCount: monthlyAccidents
    };
  }

  /**
   * Obtenir le dernier événement
   */
  private static async getLastEvent() {
    return await prisma.securityEvent.findFirst({
      where: { isReference: false },
      orderBy: { date: 'desc' }
    });
  }

  /**
   * Obtenir le dernier événement avec arrêt
   */
  private static async getLastEventWithStop() {
    return await prisma.securityEvent.findFirst({
      where: { 
        withWorkStop: true,
        isReference: false
      },
      orderBy: { date: 'desc' }
    });
  }

  /**
   * Obtenir le dernier événement sans arrêt
   */
  private static async getLastEventWithoutStop() {
    return await prisma.securityEvent.findFirst({
      where: { 
        withWorkStop: false,
        isReference: false
      },
      orderBy: { date: 'desc' }
    });
  }

  /**
   * Compter les événements par type sur une période
   */
  private static async getEventCountsByPeriod(startDate: Date, endDate: Date) {
    const [accidents, accidentsWithStop, accidentsWithoutStop] = 
      await Promise.all([
        prisma.securityEvent.count({
          where: {
            date: { gte: startDate, lte: endDate },
            isReference: false
          }
        }),
        prisma.securityEvent.count({
          where: {
            date: { gte: startDate, lte: endDate },
            withWorkStop: true,
            isReference: false
          }
        }),
        prisma.securityEvent.count({
          where: {
            date: { gte: startDate, lte: endDate },
            withWorkStop: false,
            isReference: false
          }
        })
      ]);

    return {
      accidents,
      accidentsWithStop,
      accidentsWithoutStop
    };
  }

  /**
   * Initialiser les indicateurs pour la première fois
   */
  static async initializeIndicators(userId: number) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const counters = await this.calculateAllCounters(currentYear, currentMonth);

    await prisma.securityIndicators.create({
      data: {
        ...counters,
        referenceYear: currentYear,
        referenceMonth: currentMonth,
        updatedBy: userId
      }
    });

    console.log('Indicateurs de sécurité initialisés');
  }

  /**
   * Récupérer l'historique des événements avec filtres
   */
  static async getSecurityEvents(filters?: {
    startDate?: Date;
    endDate?: Date;
    location?: string;
    severity?: SecuritySeverity;
  }) {
    const where: any = {
      isReference: false // Exclure les événements de référence de l'affichage
    };

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }
    if (filters?.location) where.location = { contains: filters.location };
    if (filters?.severity) where.severity = filters.severity;

    return await prisma.securityEvent.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
  }

  /**
   * Calculer le record de jours sans accident en analysant l'historique
   */
  private static async calculateRecordDaysWithoutAccident(): Promise<{ record: number; recordDate: Date | null }> {
    // Récupérer tous les événements (sauf référence) triés par date
    const events = await prisma.securityEvent.findMany({
      where: { isReference: false },
      orderBy: { date: 'asc' },
      select: { date: true }
    });

    // Récupérer la date de début de suivi
    const indicators = await prisma.securityIndicators.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { monitoringStartDate: true }
    });

    const monitoringStartDate = indicators?.monitoringStartDate;

    if (events.length === 0) {
      // Aucun événement, le record est depuis la date de début de suivi
      if (monitoringStartDate) {
        const today = new Date();
        const daysSinceMonitoringStart = Math.floor((today.getTime() - monitoringStartDate.getTime()) / (1000 * 60 * 60 * 24));
        return { record: daysSinceMonitoringStart, recordDate: monitoringStartDate };
      }
      return { record: 0, recordDate: null };
    }

    let maxDaysWithoutAccident = 0;
    let recordStartDate: Date | null = null;

    // Vérifier la période depuis la date de début de suivi jusqu'au premier événement
    if (monitoringStartDate && events.length > 0) {
      const daysFromMonitoringStartToFirst = Math.floor((events[0].date.getTime() - monitoringStartDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysFromMonitoringStartToFirst > maxDaysWithoutAccident) {
        maxDaysWithoutAccident = daysFromMonitoringStartToFirst;
        recordStartDate = monitoringStartDate;
      }
    }

    // Vérifier les périodes entre les événements
    for (let i = 0; i < events.length - 1; i++) {
      const daysBetween = Math.floor((events[i + 1].date.getTime() - events[i].date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysBetween > maxDaysWithoutAccident) {
        maxDaysWithoutAccident = daysBetween;
        recordStartDate = events[i].date;
      }
    }

    // Vérifier la période depuis le dernier événement jusqu'à aujourd'hui
    const today = new Date();
    const daysSinceLastEvent = Math.floor((today.getTime() - events[events.length - 1].date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastEvent > maxDaysWithoutAccident) {
      maxDaysWithoutAccident = daysSinceLastEvent;
      recordStartDate = events[events.length - 1].date;
    }

    return { record: maxDaysWithoutAccident, recordDate: recordStartDate };
  }
} 