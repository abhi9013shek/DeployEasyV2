import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning database demo records...');

  await prisma.activity.deleteMany();
  await prisma.deployment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Database is clean! Ready for real GitHub user signups.');
}

main()
  .catch((e) => {
    console.error('❌ Clean failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
