import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

process.env.NODE_ENV = 'test';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Ensure the database is set up for tests
  try {
    // Try to apply migrations first for CI environments
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } catch {
    // If migrations fail, fall back to db push
    try {
      execSync('npx prisma db push', { stdio: 'inherit' });
    } catch {
      console.warn('Database setup failed, but tests may still work with existing schema');
    }
  }
});

// No global cleanup - each test file handles its own cleanup

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };