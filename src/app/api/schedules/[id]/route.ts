import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/lib/auth";
import { ScheduleStatus, SchedulePriority } from "@/features/schedule/types";

// GET /api/schedules/[id] - Récupérer une planification par ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'ID invalide' },
        { status: 400 }
      );
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id },
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

    if (!schedule) {
      return NextResponse.json(
        { message: 'Planification introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Erreur lors de la récupération de la planification:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la récupération de la planification' },
      { status: 500 }
    );
  }
}

// PUT /api/schedules/[id] - Mettre à jour une planification
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'ID invalide' },
        { status: 400 }
      );
    }

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

    // Vérifier que la planification existe
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id },
      include: { recurrence: true },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { message: 'Planification introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que le slideshow existe si fourni
    if (slideshowId) {
      const slideshow = await prisma.slideshow.findUnique({
        where: { id: slideshowId },
      });

      if (!slideshow) {
        return NextResponse.json(
          { message: 'Slideshow introuvable' },
          { status: 404 }
        );
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (slideshowId !== undefined) updateData.slideshowId = slideshowId;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (allDay !== undefined) updateData.allDay = allDay;
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (color !== undefined) updateData.color = color;

    // Gérer la récurrence
    if (isRecurring && recurrence) {
      if (existingSchedule.recurrence) {
        // Mettre à jour la récurrence existante
        updateData.recurrence = {
          update: {
            type: recurrence.type,
            interval: recurrence.interval,
            daysOfWeek: recurrence.daysOfWeek,
            dayOfMonth: recurrence.dayOfMonth,
            weekOfMonth: recurrence.weekOfMonth,
            endDate: recurrence.endDate ? new Date(recurrence.endDate) : null,
            occurrences: recurrence.occurrences,
          },
        };
      } else {
        // Créer une nouvelle récurrence
        updateData.recurrence = {
          create: {
            type: recurrence.type,
            interval: recurrence.interval,
            daysOfWeek: recurrence.daysOfWeek,
            dayOfMonth: recurrence.dayOfMonth,
            weekOfMonth: recurrence.weekOfMonth,
            endDate: recurrence.endDate ? new Date(recurrence.endDate) : null,
            occurrences: recurrence.occurrences,
          },
        };
      }
    } else if (!isRecurring && existingSchedule.recurrence) {
      // Supprimer la récurrence existante
      updateData.recurrence = {
        delete: true,
      };
    }

    // Mettre à jour la planification
    const schedule = await prisma.schedule.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la planification:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la mise à jour de la planification' },
      { status: 500 }
    );
  }
}

// DELETE /api/schedules/[id] - Supprimer une planification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'ID invalide' },
        { status: 400 }
      );
    }

    // Vérifier que la planification existe
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { message: 'Planification introuvable' },
        { status: 404 }
      );
    }

    // Supprimer la planification (cascade supprimera automatiquement la récurrence et les exceptions)
    await prisma.schedule.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Planification supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la planification:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la suppression de la planification' },
      { status: 500 }
    );
  }
} 