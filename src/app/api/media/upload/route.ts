import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// POST /api/media/upload
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    const uploadedMedia = [];

    for (const file of files) {
      // Validation du type de fichier
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/webm",
        "video/avi",
      ];
      if (!allowedTypes.includes(file.type)) {
        continue; // Skip les fichiers non supportés
      }

      // Génération d'un nom de fichier unique
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split(".").pop();
      const fileName = `${timestamp}_${randomString}.${extension}`;

      // Détermination du type (image ou video)
      const mediaType = file.type.startsWith("image/") ? "image" : "video";

      // Création du dossier de destination s'il n'existe pas (un seul dossier pour tous)
      const uploadDir = join(process.cwd(), "public", "uploads");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Sauvegarde du fichier
      const filePath = join(uploadDir, fileName);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Chemin relatif pour la base de données
      const relativePath = `/uploads/${fileName}`;

      let thumbnailId = null;

      // Génération de thumbnail pour les vidéos
      if (mediaType === "video") {
        try {
          const thumbnailFileName = `thumb_${timestamp}_${randomString}.jpg`;
          const thumbnailPath = join(uploadDir, thumbnailFileName);
          const thumbnailRelativePath = `/uploads/${thumbnailFileName}`;

          // Utiliser ffmpeg pour générer une thumbnail (à la seconde 1)
          await execAsync(
            `ffmpeg -i "${filePath}" -ss 00:00:01 -vframes 1 -y "${thumbnailPath}"`
          );

          // Sauvegarder la thumbnail en base
          const thumbnail = await prisma.media.create({
            data: {
              originalFileName: `${file.name}_thumbnail.jpg`,
              fileName: thumbnailFileName,
              path: thumbnailRelativePath,
              format: "jpg",
              type: "image",
              size: 0, // Sera mis à jour si nécessaire
            },
          });

          thumbnailId = thumbnail.id;
        } catch (error) {
          console.warn("Erreur lors de la génération de thumbnail:", error);
          // Continue sans thumbnail si erreur
        }
      }

      // Sauvegarde en base de données
      const media = await prisma.media.create({
        data: {
          originalFileName: file.name,
          fileName: fileName,
          path: relativePath,
          format: extension || "",
          type: mediaType,
          size: file.size,
          thumbnailId: thumbnailId,
        },
      });

      // Récupérer les informations de thumbnail si elle existe
      const mediaWithThumbnail = await prisma.media.findUnique({
        where: { id: media.id },
        include: { thumbnail: true },
      });

      uploadedMedia.push({
        id: media.id.toString(),
        name: media.originalFileName,
        type: media.type as "image" | "video",
        url: relativePath,
        size: formatFileSize(media.size),
        uploadedAt: media.uploadedAt.toISOString().split("T")[0],
        thumbnail: mediaWithThumbnail?.thumbnail
          ? {
              id: mediaWithThumbnail.thumbnail.id.toString(),
              url: mediaWithThumbnail.thumbnail.path,
            }
          : null,
      });
    }

    return NextResponse.json({
      message: `${uploadedMedia.length} fichier(s) uploadé(s) avec succès`,
      media: uploadedMedia,
    });
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload des fichiers" },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour formater la taille des fichiers
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
