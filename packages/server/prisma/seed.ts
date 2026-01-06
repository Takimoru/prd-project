import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      googleId: 'admin-123',
    },
  });

  console.log({ admin });

  // Create Program
  const program = await prisma.program.create({
    data: {
      title: 'Batch 1 2024',
      description: 'First batch of the year',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-01'),
      createdBy: admin.id,
    }
  });

  console.log({ program });

  // Create Team
  const team = await prisma.team.create({
    data: {
      name: 'Alpha Team',
      programId: program.id,
      leaderId: admin.id, // Just for testing
      // Members not strictly required by Prisma schema unless we populate relation
    }
  });
  
  console.log({ team });
  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
