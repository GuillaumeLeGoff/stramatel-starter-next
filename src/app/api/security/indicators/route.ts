import { NextRequest, NextResponse } from 'next/server';
import { SecurityService } from '@/features/security/services/securityService';

// GET - Récupérer les indicateurs digitaux de sécurité
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days');

    const indicators = await SecurityService.getDigitalIndicators();
    
    // Calculer les accidents sur X jours si demandé
    let accidentsLastXDays = null;
    if (days && !isNaN(parseInt(days))) {
      accidentsLastXDays = await indicators.accidentsLastXDays(parseInt(days));
    }

    const response = {
      // Date et heure actuelles
      currentDate: indicators.currentDate.toLocaleDateString('fr-FR'),
      currentTime: indicators.currentTime,
      
      // Compteurs de jours sans accident
      daysWithoutAccident: indicators.daysWithoutAccident,
      daysWithoutAccidentWithStop: indicators.daysWithoutAccidentWithStop,
      daysWithoutAccidentWithoutStop: indicators.daysWithoutAccidentWithoutStop,
      
      // Records
      recordDaysWithoutAccident: indicators.recordDaysWithoutAccident,
      lastAccidentDate: indicators.lastAccidentDate?.toLocaleDateString('fr-FR') || null,
      
      // Compteurs annuels
      currentYearAccidents: indicators.currentYearAccidents,
      currentYearAccidentsWithStop: indicators.currentYearAccidentsWithStop,
      currentYearAccidentsWithoutStop: indicators.currentYearAccidentsWithoutStop,
      currentYearMinorCare: indicators.currentYearMinorCare,
      currentYearNearMiss: indicators.currentYearNearMiss,
      currentYearDangerousSituations: indicators.currentYearDangerousSituations,
      
      // Compteurs mensuels
      currentMonthAccidents: indicators.currentMonthAccidents,
      
      // Compteurs personnalisés
      ...(accidentsLastXDays !== null && { [`accidentsLast${days}Days`]: accidentsLastXDays })
    };
    
    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des indicateurs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des indicateurs de sécurité' 
      },
      { status: 500 }
    );
  }
}

// POST - Forcer la mise à jour des indicateurs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.userId) {
      return NextResponse.json(
        { success: false, error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    await SecurityService.updateSecurityIndicators(body.userId);
    
    // Récupérer les nouveaux indicateurs
    const indicators = await SecurityService.getDigitalIndicators();
    
    return NextResponse.json({
      success: true,
      data: indicators,
      message: 'Indicateurs mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des indicateurs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la mise à jour des indicateurs' 
      },
      { status: 500 }
    );
  }
} 