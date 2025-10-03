"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const child_process_1 = require("child_process");
process.env.NODE_ENV = 'test';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key_for_testing';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock_webhook_secret_for_testing';
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
beforeAll(async () => {
    // Ensure the database is set up for tests
    try {
        // Try to apply migrations first for CI environments
        (0, child_process_1.execSync)('npx prisma migrate deploy', { stdio: 'inherit' });
    }
    catch {
        // If migrations fail, fall back to db push
        try {
            (0, child_process_1.execSync)('npx prisma db push', { stdio: 'inherit' });
        }
        catch {
            console.warn('Database setup failed, but tests may still work with existing schema');
        }
    }
});
// No global cleanup - each test file handles its own cleanup
afterAll(async () => {
    await prisma.$disconnect();
});
