import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';

// GET /api/media/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const media = await prisma.media.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        thumbnail: true,
        thumbnails: true,
        slide: {
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

    if (!media) {
      return NextResponse.json(
        { error: 'Média non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(media);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du média' },
      { status: 500 }
    );
  }
}

// PUT /api/media/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
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

    const media = await prisma.media.update({
      where: {
        id: parseInt(id),
      },
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

    return NextResponse.json(media);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du média' },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour supprimer un fichier physique
async function deletePhysicalFile(filePath: string): Promise<void> {
  try {
    // Construire le chemin complet vers le fichier
    const fullPath = path.join(process.cwd(), 'public', filePath);
    await unlink(fullPath);
    console.log(`Fichier supprimé: ${fullPath}`);
  } catch (error) {
    console.error(`Erreur lors de la suppression du fichier ${filePath}:`, error);
    // On ne lance pas d'erreur pour ne pas bloquer la suppression en base
  }
}

// DELETE /api/media/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    // Récupérer le média avec sa thumbnail
    const media = await prisma.media.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        thumbnail: true,
      },
    });

    if (!media) {
      return NextResponse.json(
        { error: 'Média non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si le média est utilisé comme thumbnail par d'autres médias
    const usedAsThumbnail = await prisma.media.findFirst({
      where: {
        thumbnailId: parseInt(id),
      },
    });

    if (usedAsThumbnail) {
      return NextResponse.json(
        { error: 'Ce média est utilisé comme thumbnail et ne peut pas être supprimé' },
        { status: 400 }
      );
    }

    // Si c'est une vidéo avec une thumbnail, supprimer d'abord la thumbnail
    if (media.type === 'video' && media.thumbnail) {
      try {
        // Supprimer le fichier physique de la thumbnail
        await deletePhysicalFile(media.thumbnail.path);
        
        // Supprimer la thumbnail de la base de données
        await prisma.media.delete({
          where: {
            id: media.thumbnail.id,
          },
        });
        console.log(`Thumbnail ${media.thumbnail.id} supprimée pour la vidéo ${id}`);
      } catch (error) {
        console.error('Erreur lors de la suppression de la thumbnail:', error);
        // On continue même si la suppression de la thumbnail échoue
      }
    }

    // Supprimer le fichier physique du média principal
    await deletePhysicalFile(media.path);

    // Supprimer le média principal de la base de données
    await prisma.media.delete({
      where: {
        id: parseInt(id),
      },
    });

    return NextResponse.json(
      { message: 'Média et fichiers supprimés avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la suppression du média:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du média' },
      { status: 500 }
    );
  }
} 