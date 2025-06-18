export enum SecurityEventType {
  ACCIDENT = 'ACCIDENT',
  ACCIDENT_WITH_STOP = 'ACCIDENT_WITH_STOP',
  ACCIDENT_WITHOUT_STOP = 'ACCIDENT_WITHOUT_STOP',
  MINOR_CARE = 'MINOR_CARE',
  NEAR_MISS = 'NEAR_MISS',
  DANGEROUS_SITUATION = 'DANGEROUS_SITUATION'
}

export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface SecurityEvent {
  id: number;
  type: SecurityEventType;
  date: Date;
  description?: string;
  location?: string;
  severity?: SecuritySeverity;
  withWorkStop: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: number;
    username: string;
  };
}

export interface SecurityIndicators {
  id: number;
  lastAccidentDate?: Date;
  lastAccidentWithStopDate?: Date;
  lastAccidentWithoutStopDate?: Date;
  recordStartDate?: Date;
  currentDaysWithoutAccident: number;
  currentDaysWithoutAccidentWithStop: number;
  currentDaysWithoutAccidentWithoutStop: number;
  recordDaysWithoutAccident: number;
  recordDaysWithoutAccidentDate?: Date;
  yearlyAccidentsCount: number;
  yearlyAccidentsWithStopCount: number;
  yearlyAccidentsWithoutStopCount: number;
  yearlyMinorCareCount: number;
  yearlyNearMissCount: number;
  yearlyDangerousSituationCount: number;
  monthlyAccidentsCount: number;
  referenceYear: number;
  referenceMonth: number;
  updatedAt: Date;
  updatedBy: number;
}

export interface DigitalDisplayData {
  // Date et heure
  currentDate: string;
  currentTime: string;
  
  // Jours sans accident
  daysWithoutAccident: number;
  daysWithoutAccidentWithStop: number;
  daysWithoutAccidentWithoutStop: number;
  
  // Records
  recordDaysWithoutAccident: number;
  lastAccidentDate?: string;
  
  // Compteurs annuels
  currentYearAccidents: number;
  currentYearAccidentsWithStop: number;
  currentYearAccidentsWithoutStop: number;
  currentYearMinorCare: number;
  currentYearNearMiss: number;
  currentYearDangerousSituations: number;
  
  // Compteurs mensuels
  currentMonthAccidents: number;
}

export interface SecurityEventFilters {
  type?: SecurityEventType;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  severity?: SecuritySeverity;
}

export interface CreateSecurityEventRequest {
  type: SecurityEventType;
  date: string; // ISO date string
  description?: string;
  location?: string;
  severity?: SecuritySeverity;
  withWorkStop?: boolean;
}

export interface SecurityStatsResponse {
  totalEvents: number;
  accidentsByType: Record<SecurityEventType, number>;
  accidentsBySeverity: Record<SecuritySeverity, number>;
  monthlyTrend: Array<{
    month: string;
    count: number;
  }>;
  averageDaysBetweenAccidents: number;
} 