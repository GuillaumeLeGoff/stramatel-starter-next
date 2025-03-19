import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('test123', 10);
  
  const existingUser = await prisma.user.findFirst({
    where: { name: 'test' }
  });

  if (existingUser) {
    console.log('Test user already exists:', existingUser);
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: 'test',
      password: hashedPassword,
    },
  });

  console.log('Test user created:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 