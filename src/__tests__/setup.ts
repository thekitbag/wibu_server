import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

process.env.NODE_ENV = 'test';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Ensure the database is set up for tests
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } catch (error) {
    console.warn('Migration failed, trying db push:', error);
    try {
      execSync('npx prisma db push', { stdio: 'inherit' });
    } catch (pushError) {
      console.error('Failed to setup database:', pushError);
    }
  }
});

// No global cleanup - each test file handles its own cleanup

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };