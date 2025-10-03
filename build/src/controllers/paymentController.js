"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSession = void 0;
const server_1 = require("../server");
const paymentService_1 = require("../services/paymentService");
/**
 * Creates a Stripe checkout session for a journey payment
 * Validates journey existence and payment status before creating the session
 */
const createCheckoutSession = async (req, res) => {
    try {
        const { journeyId } = req.params;
        // Validate journey exists and get journey details
        const journey = await server_1.prisma.journey.findUnique({
            where: { id: journeyId }
        });
        if (!journey) {
            return res.status(404).json({ error: 'Journey not found' });
        }
        // Prevent duplicate payments for the same journey
        if (journey.paid) {
            return res.status(400).json({ error: 'Journey is already paid for' });
        }
        // Create Stripe checkout session using the payment service
        const session = await (0, paymentService_1.createStripeCheckoutSession)(journeyId, journey.title);
        res.json({ id: session.id });
    }
    catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createCheckoutSession = createCheckoutSession;
