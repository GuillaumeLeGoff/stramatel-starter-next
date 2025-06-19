import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../prisma/generated/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const indicators = await prisma.securityIndicators.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { monitoringStartDate: true }
    });

    return NextResponse.json({ 
      monitoringStartDate: indicators?.monitoringStartDate 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la date de début de suivi:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la date de début de suivi' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { monitoringStartDate, updatedBy } = await request.json();

    if (!monitoringStartDate || !updatedBy) {
      return NextResponse.json(
        { error: 'Date de début de suivi et utilisateur requis' },
        { status: 400 }
      );
    }

    // Récupérer les indicateurs actuels
    const existingIndicators = await prisma.securityIndicators.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (existingIndicators) {
      // Mettre à jour les indicateurs existants
      await prisma.securityIndicators.update({
        where: { id: existingIndicators.id },
        data: {
          monitoringStartDate: new Date(monitoringStartDate),
          updatedBy
        }
      });
    } else {
      // Créer de nouveaux indicateurs avec la date de début de suivi
      const today = new Date();
      await prisma.securityIndicators.create({
        data: {
          monitoringStartDate: new Date(monitoringStartDate),
          referenceYear: today.getFullYear(),
          referenceMonth: today.getMonth() + 1,
          updatedBy
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      monitoringStartDate: new Date(monitoringStartDate) 
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la date de début de suivi:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la date de début de suivi' },
      { status: 500 }
    );
  }
} 