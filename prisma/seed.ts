import { PrismaClient } from "./generated/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Vérifier si l'utilisateur admin existe déjà
  const existingAdmin = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  let adminUser;

  if (!existingAdmin) {
    // Créer l'utilisateur admin par défaut
    const hashedPassword = await bcrypt.hash("admin123", 10);

    adminUser = await prisma.user.create({
      data: {
        username: "admin",
        password: hashedPassword,
        language: "fr",
        theme: "light",
        role: "ADMIN",
      },
    });

    console.log("Utilisateur admin créé avec succès");
  } else {
    adminUser = existingAdmin;
    console.log("L'utilisateur admin existe déjà");
  }

  // Vérifier si l'événement de référence existe déjà
  const existingReferenceEvent = await prisma.securityEvent.findFirst({
    where: { isReference: true }
  });

  if (!existingReferenceEvent) {
    // Créer un événement de référence (date de début)
    const referenceDate = new Date();
    referenceDate.setDate(referenceDate.getDate() - 365); // Il y a 1 an

    await prisma.securityEvent.create({
      data: {
        date: referenceDate,
        description: "Date de début de référence pour le calcul des indicateurs",
        location: "Système",
        severity: "MEDIUM",
        withWorkStop: false,
        isReference: true,
        createdBy: adminUser.id
      }
    });

    console.log("Événement de référence créé avec succès");
  } else {
    console.log("L'événement de référence existe déjà");
  }

  // Forcer la mise à jour des indicateurs de sécurité
  try {
    const { SecurityService } = await import('../src/features/security/services/securityService');
    await SecurityService.updateSecurityIndicators(adminUser.id);
    console.log('Indicateurs de sécurité mis à jour après seed');
  } catch (e) {
    console.error('Erreur lors de la mise à jour des indicateurs de sécurité dans le seed:', e);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
