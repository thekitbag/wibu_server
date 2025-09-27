import { PrismaClient } from '../../generated/prisma';

process.env.NODE_ENV = 'test';

const prisma = new PrismaClient();

beforeEach(async () => {
  await prisma.journey.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };