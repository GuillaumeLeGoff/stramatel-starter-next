import { PrismaClient } from '@prisma/client';

// Création d'une instance PrismaClient globale pour éviter les connexions multiples en développement
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 