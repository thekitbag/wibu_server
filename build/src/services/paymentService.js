"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStripeCheckoutSession = exports.processSuccessfulPayment = exports.verifyStripeWebhook = exports.createStripeCheckoutSession = exports.generateShareableToken = void 0;
const stripe_1 = __importDefault(require("stripe"));
const crypto_1 = require("crypto");
const server_1 = require("../server");
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
}
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
/**
 * Generates a cryptographically secure random token for shareable journey links
 * @returns A 64-character hexadecimal string (32 bytes)
 */
const generateShareableToken = () => {
    return (0, crypto_1.randomBytes)(32).toString('hex');
};
exports.generateShareableToken = generateShareableToken;
/**
 * Creates a Stripe checkout session for a journey payment
 * @param journeyId - The ID of the journey to create payment for
 * @param journeyTitle - The title of the journey for the product name
 * @returns Promise<Stripe.Checkout.Session> - The created checkout session
 */
const createStripeCheckoutSession = async (journeyId, journeyTitle) => {
    // Determine the client URL for redirects (local vs production)
    const clientUrl = process.env.CLIENT_URL || 'https://whatiboughtyou.com';
    return await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'gbp',
                    product_data: {
                        name: `Journey: ${journeyTitle}`,
                        description: 'Share your thoughtful journey with someone special',
                    },
                    unit_amount: 500, // £5.00 in pence
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        allow_promotion_codes: true, // Enable coupon/promotion code support
        success_url: `${clientUrl}/journeys/${journeyId}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl}/journeys/${journeyId}`,
        metadata: {
            journeyId: journeyId,
        },
    });
};
exports.createStripeCheckoutSession = createStripeCheckoutSession;
/**
 * Verifies a Stripe webhook signature and returns the parsed event
 * @param rawBody - The raw request body from Stripe
 * @param signature - The Stripe signature header
 * @returns Promise<Stripe.Event> - The verified webhook event
 * @throws Error if signature verification fails
 */
const verifyStripeWebhook = (rawBody, signature) => {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
    }
    return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
};
exports.verifyStripeWebhook = verifyStripeWebhook;
/**
 * Processes a successful payment by updating the journey status and generating a shareable token
 * @param journeyId - The ID of the journey that was paid for
 * @returns Promise<string> - The generated shareable token
 * @throws Error if journey update fails
 */
const processSuccessfulPayment = async (journeyId) => {
    // Generate unique shareable token for the paid journey
    const shareableToken = (0, exports.generateShareableToken)();
    // Update journey with payment status and shareable token
    await server_1.prisma.journey.update({
        where: { id: journeyId },
        data: {
            paid: true,
            shareableToken: shareableToken,
        },
    });
    return shareableToken;
};
exports.processSuccessfulPayment = processSuccessfulPayment;
/**
 * Retrieves a Stripe checkout session and checks its payment status
 * @param sessionId - The Stripe checkout session ID
 * @returns Promise<Stripe.Checkout.Session> - The Stripe session object
 * @throws Error if session retrieval fails
 */
const getStripeCheckoutSession = async (sessionId) => {
    return await stripe.checkout.sessions.retrieve(sessionId);
};
exports.getStripeCheckoutSession = getStripeCheckoutSession;
