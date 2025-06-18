import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../../prisma/generated/client';
import { SecurityService } from '@/features/security/services/securityService';
import { SecurityEventType, SecuritySeverity } from '@/features/security/types';

const prisma = new PrismaClient();

// GET - Récupérer un événement spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json(
        { success: false, error: 'ID d\'événement invalide' },
        { status: 400 }
      );
    }

    const event = await prisma.securityEvent.findUnique({
      where: { id: eventId },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'événement:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération de l\'événement' 
      },
      { status: 500 }
    );
  }
}

// PUT - Modifier un événement existant
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json(
        { success: false, error: 'ID d\'événement invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Vérifier que l'événement existe
    const existingEvent = await prisma.securityEvent.findUnique({
      where: { id: eventId }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Validation des données
    const updateData: any = {};
    
    if (body.type && Object.values(SecurityEventType).includes(body.type)) {
      updateData.type = body.type;
    }
    
    if (body.date) {
      updateData.date = new Date(body.date);
    }
    
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    
    if (body.location !== undefined) {
      updateData.location = body.location;
    }
    
    if (body.severity && Object.values(SecuritySeverity).includes(body.severity)) {
      updateData.severity = body.severity;
    }
    
    if (body.withWorkStop !== undefined) {
      updateData.withWorkStop = body.withWorkStop;
    }

    // Mettre à jour l'événement
    const updatedEvent = await prisma.securityEvent.update({
      where: { id: eventId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    // Recalculer les indicateurs si nécessaire
    if (body.type || body.date) {
      await SecurityService.updateSecurityIndicators(existingEvent.createdBy);
    }

    return NextResponse.json({
      success: true,
      data: updatedEvent,
      message: 'Événement mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la mise à jour de l\'événement' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un événement
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json(
        { success: false, error: 'ID d\'événement invalide' },
        { status: 400 }
      );
    }

    // Vérifier que l'événement existe
    const existingEvent = await prisma.securityEvent.findUnique({
      where: { id: eventId }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer l'événement
    await prisma.securityEvent.delete({
      where: { id: eventId }
    });

    // Recalculer les indicateurs
    await SecurityService.updateSecurityIndicators(existingEvent.createdBy);

    return NextResponse.json({
      success: true,
      message: 'Événement supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la suppression de l\'événement' 
      },
      { status: 500 }
    );
  }
} 