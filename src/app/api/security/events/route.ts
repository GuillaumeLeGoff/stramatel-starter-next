import { NextRequest, NextResponse } from 'next/server';
import { SecurityService } from '@/features/security/services/securityService';
import { SecurityEventType, SecuritySeverity } from '@/features/security/types';

// GET - Récupérer les événements de sécurité avec filtres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: any = {};
    
    // Filtres depuis les paramètres URL
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const location = searchParams.get('location');
    const severity = searchParams.get('severity');

    if (type && Object.values(SecurityEventType).includes(type as SecurityEventType)) {
      filters.type = type as SecurityEventType;
    }
    
    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    
    if (endDate) {
      filters.endDate = new Date(endDate);
    }
    
    if (location) {
      filters.location = location;
    }
    
    if (severity && Object.values(SecuritySeverity).includes(severity as SecuritySeverity)) {
      filters.severity = severity as SecuritySeverity;
    }

    const events = await SecurityService.getSecurityEvents(filters);
    
    return NextResponse.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des événements de sécurité' 
      },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel événement de sécurité
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation des données
    if (!body.type || !Object.values(SecurityEventType).includes(body.type)) {
      return NextResponse.json(
        { success: false, error: 'Type d\'événement requis et valide' },
        { status: 400 }
      );
    }
    
    if (!body.date) {
      return NextResponse.json(
        { success: false, error: 'Date de l\'événement requise' },
        { status: 400 }
      );
    }
    
    if (!body.createdBy) {
      return NextResponse.json(
        { success: false, error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    // Validation de la sévérité si fournie
    if (body.severity && !Object.values(SecuritySeverity).includes(body.severity)) {
      return NextResponse.json(
        { success: false, error: 'Sévérité invalide' },
        { status: 400 }
      );
    }

    const eventData = {
      type: body.type,
      date: new Date(body.date),
      description: body.description,
      location: body.location,
      severity: body.severity,
      withWorkStop: body.withWorkStop || false,
      createdBy: body.createdBy
    };

    const event = await SecurityService.createSecurityEvent(eventData);
    
    return NextResponse.json({
      success: true,
      data: event,
      message: 'Événement de sécurité créé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la création de l\'événement de sécurité' 
      },
      { status: 500 }
    );
  }
} 