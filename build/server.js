"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const journeys_1 = __importDefault(require("./routes/journeys"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const reveal_1 = __importDefault(require("./routes/reveal"));
const checkout_1 = __importDefault(require("./routes/checkout"));
const app = (0, express_1.default)();
exports.app = app;
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
const PORT = process.env.PORT || 8080;
// Webhook routes need to be defined BEFORE express.json() middleware
// to ensure raw body is available for signature verification
app.use('/api/webhooks', webhooks_1.default);
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.json({ message: 'WIBU Server is running' });
});
app.use('/api/journeys', journeys_1.default);
app.use('/api/reveal', reveal_1.default);
app.use('/api/checkout-session', checkout_1.default);
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
