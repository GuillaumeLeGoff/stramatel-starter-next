import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/media
export async function GET() {
  try {
    const media = await prisma.media.findMany({
      where: {
        // Exclure les médias qui sont utilisés comme thumbnails
        // Un média est une thumbnail s'il est référencé par un autre média via thumbnailId
        NOT: {
          thumbnails: {
            some: {},
          },
        },
      },
      include: {
        thumbnail: true,
        thumbnails: true,
        slides: {
          include: {
            slideshow: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(media);
  } catch (err) {
    console.error("Erreur lors de la récupération des médias:", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des médias" },
      { status: 500 }
    );
  }
}

// POST /api/media
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      originalFileName,
      fileName,
      path,
      format,
      type,
      size,
      thumbnailId,
    } = body;

    const media = await prisma.media.create({
      data: {
        originalFileName,
        fileName,
        path,
        format,
        type,
        size,
        thumbnailId,
      },
      include: {
        thumbnail: true,
        thumbnails: true,
      },
    });

    return NextResponse.json(media, { status: 201 });
  } catch (err) {
    console.error("Erreur lors de la création du média:", err);
    return NextResponse.json(
      { error: "Erreur lors de la création du média" },
      { status: 500 }
    );
  }
}
