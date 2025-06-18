import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../prisma/generated/client';
import { SecurityEventType } from '@/features/security/types';

const prisma = new PrismaClient();

// GET - Récupérer les statistiques de sécurité
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    
    // Compter tous les événements
    const totalEvents = await prisma.securityEvent.count();
    
    // Événements par type
    const eventsByType = await Promise.all(
      Object.values(SecurityEventType).map(async (type) => ({
        type,
        count: await prisma.securityEvent.count({ where: { type } })
      }))
    );
    
    const accidentsByType = eventsByType.reduce((acc, { type, count }) => {
      acc[type] = count;
      return acc;
    }, {} as Record<SecurityEventType, number>);
    
    // Événements par sévérité
    const eventsBySeverity = await prisma.securityEvent.groupBy({
      by: ['severity'],
      _count: {
        severity: true
      }
    });
    
    const accidentsBySeverity = eventsBySeverity.reduce((acc, { severity, _count }) => {
      if (severity) {
        acc[severity] = _count.severity;
      }
      return acc;
    }, {} as any);
    
    // Tendance mensuelle pour l'année
    const monthlyTrend = [];
    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      
      const count = await prisma.securityEvent.count({
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
      
      monthlyTrend.push({
        month: new Date(year, month - 1, 1).toLocaleDateString('fr-FR', { month: 'long' }),
        count
      });
    }
    
    // Calcul de la moyenne de jours entre accidents
    const accidents = await prisma.securityEvent.findMany({
      where: {
        type: {
          in: [
            SecurityEventType.ACCIDENT,
            SecurityEventType.ACCIDENT_WITH_STOP,
            SecurityEventType.ACCIDENT_WITHOUT_STOP
          ]
        }
      },
      orderBy: { date: 'asc' },
      select: { date: true }
    });
    
    let averageDaysBetweenAccidents = 0;
    if (accidents.length > 1) {
      const daysBetween = [];
      for (let i = 1; i < accidents.length; i++) {
        const days = Math.floor(
          (accidents[i].date.getTime() - accidents[i - 1].date.getTime()) / (1000 * 60 * 60 * 24)
        );
        daysBetween.push(days);
      }
      averageDaysBetweenAccidents = Math.round(
        daysBetween.reduce((sum, days) => sum + days, 0) / daysBetween.length
      );
    }
    
    const response = {
      totalEvents,
      accidentsByType,
      accidentsBySeverity,
      monthlyTrend,
      averageDaysBetweenAccidents,
      year
    };
    
    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des statistiques de sécurité' 
      },
      { status: 500 }
    );
  }
} 