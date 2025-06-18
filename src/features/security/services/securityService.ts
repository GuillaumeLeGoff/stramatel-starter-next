import { PrismaClient } from '../../../../prisma/generated/client';
import { SecurityEventType, SecuritySeverity } from '../types';

const prisma = new PrismaClient();

export interface SecurityEventData {
  type: SecurityEventType;
  date: Date;
  description?: string;
  location?: string;
  severity?: SecuritySeverity;
  withWorkStop?: boolean;
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
        type: {
          in: [
            SecurityEventType.ACCIDENT,
            SecurityEventType.ACCIDENT_WITH_STOP,
            SecurityEventType.ACCIDENT_WITHOUT_STOP
          ]
        }
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

    // Trouver le dernier accident de chaque type
    const lastAccident = await this.getLastEventByType([
      SecurityEventType.ACCIDENT,
      SecurityEventType.ACCIDENT_WITH_STOP,
      SecurityEventType.ACCIDENT_WITHOUT_STOP
    ]);

    const lastAccidentWithStop = await this.getLastEventByType([
      SecurityEventType.ACCIDENT,
      SecurityEventType.ACCIDENT_WITH_STOP
    ]);

    const lastAccidentWithoutStop = await this.getLastEventByType([
      SecurityEventType.ACCIDENT,
      SecurityEventType.ACCIDENT_WITHOUT_STOP
    ]);

    // Calculer les jours sans accident
    const daysWithoutAccident = lastAccident 
      ? Math.floor((today.getTime() - lastAccident.date.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const daysWithoutAccidentWithStop = lastAccidentWithStop
      ? Math.floor((today.getTime() - lastAccidentWithStop.date.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const daysWithoutAccidentWithoutStop = lastAccidentWithoutStop
      ? Math.floor((today.getTime() - lastAccidentWithoutStop.date.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Calculer le record
    const existingRecord = await prisma.securityIndicators.findFirst({
      orderBy: { recordDaysWithoutAccident: 'desc' }
    });

    const recordDaysWithoutAccident = Math.max(
      daysWithoutAccident,
      existingRecord?.recordDaysWithoutAccident || 0
    );

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
        type: {
          in: [
            SecurityEventType.ACCIDENT,
            SecurityEventType.ACCIDENT_WITH_STOP,
            SecurityEventType.ACCIDENT_WITHOUT_STOP
          ]
        }
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
      recordDaysWithoutAccidentDate: recordDaysWithoutAccident > (existingRecord?.recordDaysWithoutAccident || 0) 
        ? today : existingRecord?.recordDaysWithoutAccidentDate,
      yearlyAccidentsCount: yearlyCounters.accidents,
      yearlyAccidentsWithStopCount: yearlyCounters.accidentsWithStop,
      yearlyAccidentsWithoutStopCount: yearlyCounters.accidentsWithoutStop,
      yearlyMinorCareCount: yearlyCounters.minorCare,
      yearlyNearMissCount: yearlyCounters.nearMiss,
      yearlyDangerousSituationCount: yearlyCounters.dangerousSituations,
      monthlyAccidentsCount: monthlyAccidents
    };
  }

  /**
   * Obtenir le dernier événement d'un type donné
   */
  private static async getLastEventByType(types: SecurityEventType[]) {
    return await prisma.securityEvent.findFirst({
      where: { type: { in: types } },
      orderBy: { date: 'desc' }
    });
  }

  /**
   * Compter les événements par type sur une période
   */
  private static async getEventCountsByPeriod(startDate: Date, endDate: Date) {
    const [accidents, accidentsWithStop, accidentsWithoutStop, minorCare, nearMiss, dangerousSituations] = 
      await Promise.all([
        prisma.securityEvent.count({
          where: {
            date: { gte: startDate, lte: endDate },
            type: { in: [SecurityEventType.ACCIDENT, SecurityEventType.ACCIDENT_WITH_STOP, SecurityEventType.ACCIDENT_WITHOUT_STOP] }
          }
        }),
        prisma.securityEvent.count({
          where: {
            date: { gte: startDate, lte: endDate },
            type: { in: [SecurityEventType.ACCIDENT, SecurityEventType.ACCIDENT_WITH_STOP] }
          }
        }),
        prisma.securityEvent.count({
          where: {
            date: { gte: startDate, lte: endDate },
            type: { in: [SecurityEventType.ACCIDENT, SecurityEventType.ACCIDENT_WITHOUT_STOP] }
          }
        }),
        prisma.securityEvent.count({
          where: {
            date: { gte: startDate, lte: endDate },
            type: SecurityEventType.MINOR_CARE
          }
        }),
        prisma.securityEvent.count({
          where: {
            date: { gte: startDate, lte: endDate },
            type: SecurityEventType.NEAR_MISS
          }
        }),
        prisma.securityEvent.count({
          where: {
            date: { gte: startDate, lte: endDate },
            type: SecurityEventType.DANGEROUS_SITUATION
          }
        })
      ]);

    return {
      accidents,
      accidentsWithStop,
      accidentsWithoutStop,
      minorCare,
      nearMiss,
      dangerousSituations
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
    type?: SecurityEventType;
    startDate?: Date;
    endDate?: Date;
    location?: string;
    severity?: SecuritySeverity;
  }) {
    const where: any = {};

    if (filters?.type) where.type = filters.type;
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
} 