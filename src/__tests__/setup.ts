import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

process.env.NODE_ENV = 'test';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Ensure the database is set up for tests
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to setup database:', error);
  }
});

beforeEach(async () => {
  await prisma.journey.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };