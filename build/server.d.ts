import { PrismaClient } from '@prisma/client';
declare const app: import("express-serve-static-core").Express;
declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export { app, prisma };
