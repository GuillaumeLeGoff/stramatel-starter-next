import { PrismaClient } from "./generated/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Vérifier si l'utilisateur admin existe déjà
  const existingAdmin = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (!existingAdmin) {
    // Créer l'utilisateur admin par défaut
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await prisma.user.create({
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
    console.log("L'utilisateur admin existe déjà");
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
