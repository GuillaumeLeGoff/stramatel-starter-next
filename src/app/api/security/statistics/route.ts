import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../prisma/generated/client';
import { SecuritySeverity } from '@/features/security/types';

const prisma = new PrismaClient();

// GET - Récupérer les statistiques de sécurité
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();

    // Calculer les statistiques pour l'année spécifiée
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    // Compter les événements par sévérité
    const severityCounts = await Promise.all(
      Object.values(SecuritySeverity).map(async (severity) => ({
        severity,
        count: await prisma.securityEvent.count({
          where: {
            date: { gte: yearStart, lte: yearEnd },
            severity
          }
        })
      }))
    );

    const accidentsBySeverity = severityCounts.reduce((acc, { severity, count }) => {
      acc[severity] = count;
      return acc;
    }, {} as Record<SecuritySeverity, number>);

    // Compter le total des événements
    const totalEvents = await prisma.securityEvent.count({
      where: {
        date: { gte: yearStart, lte: yearEnd }
      }
    });

    // Calculer la tendance mensuelle
    const monthlyTrend = await Promise.all(
      Array.from({ length: 12 }, (_, i) => i).map(async (month) => {
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
        
        const count = await prisma.securityEvent.count({
          where: {
            date: { gte: monthStart, lte: monthEnd }
          }
        });

        return {
          month: monthStart.toLocaleDateString('fr-FR', { month: 'long' }),
          count
        };
      })
    );

    // Calculer la moyenne des jours entre les accidents
    const accidents = await prisma.securityEvent.findMany({
      where: {
        date: { gte: yearStart, lte: yearEnd }
      },
      orderBy: { date: 'asc' }
    });

    let averageDaysBetweenAccidents = 0;
    if (accidents.length > 1) {
      let totalDays = 0;
      for (let i = 1; i < accidents.length; i++) {
        const daysDiff = Math.floor(
          (accidents[i].date.getTime() - accidents[i - 1].date.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalDays += daysDiff;
      }
      averageDaysBetweenAccidents = Math.round(totalDays / (accidents.length - 1));
    }

    return NextResponse.json({
      success: true,
      data: {
        totalEvents,
        accidentsBySeverity,
        monthlyTrend,
        averageDaysBetweenAccidents
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des statistiques' 
      },
      { status: 500 }
    );
  }
} 