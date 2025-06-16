import { PrismaClient } from "../../prisma/generated/client";

// Création d'une instance PrismaClient globale pour éviter les connexions multiples en développement
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: "file:./dev.db?connection_limit=1&pool_timeout=20&socket_timeout=60",
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
