import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/lib/auth";
import { 
  ScheduleStatus, 
  SchedulePriority
} from "@/features/schedule/types";

// GET /api/schedules - Récupérer toutes les planifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filtres
    const status = searchParams.get('status')?.split(',');
    const priority = searchParams.get('priority')?.split(',');
    const slideshowId = searchParams.get('slideshowId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Construction de la requête
    const where: any = {};

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (priority && priority.length > 0) {
      where.priority = { in: priority };
    }

    if (slideshowId) {
      where.slideshowId = parseInt(slideshowId);
    }

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) {
        where.startDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.startDate.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slideshow: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        slideshow: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        recurrence: true,
        exceptions: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Erreur lors du chargement des planifications:', error);
    return NextResponse.json(
      { message: 'Erreur lors du chargement des planifications' },
      { status: 500 }
    );
  }
}

// POST /api/schedules - Créer une nouvelle planification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      title,
      description,
      slideshowId,
      startDate,
      endDate,
      startTime,
      endTime,
      allDay,
      isRecurring,
      status,
      priority,
      color,
      recurrence,
    } = body;

    // Validation des données requises
    if (!title || !slideshowId || !startDate || !startTime) {
      return NextResponse.json(
        { message: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Vérifier que le slideshow existe
    const slideshow = await prisma.slideshow.findUnique({
      where: { id: slideshowId },
    });

    if (!slideshow) {
      return NextResponse.json(
        { message: 'Slideshow introuvable' },
        { status: 404 }
      );
    }

    // TODO: Récupérer l'utilisateur connecté depuis la session
    // Pour l'instant, on utilise un utilisateur par défaut
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      return NextResponse.json(
        { message: 'Aucun utilisateur trouvé' },
        { status: 500 }
      );
    }

    // Créer la planification
    const schedule = await prisma.schedule.create({
      data: {
        title,
        description,
        slideshowId,
        createdBy: defaultUser.id,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        startTime,
        endTime,
        allDay,
        isRecurring,
        status,
        priority,
        color,
        ...(isRecurring && recurrence && {
          recurrence: {
            create: {
              type: recurrence.type,
              interval: recurrence.interval,
              daysOfWeek: recurrence.daysOfWeek,
              dayOfMonth: recurrence.dayOfMonth,
              weekOfMonth: recurrence.weekOfMonth,
              endDate: recurrence.endDate ? new Date(recurrence.endDate) : null,
              occurrences: recurrence.occurrences,
            },
          },
        }),
      },
      include: {
        slideshow: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        recurrence: true,
        exceptions: true,
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la planification:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la création de la planification' },
      { status: 500 }
    );
  }
} 