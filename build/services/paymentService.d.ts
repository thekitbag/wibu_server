import Stripe from 'stripe';
/**
 * Generates a cryptographically secure random token for shareable journey links
 * @returns A 64-character hexadecimal string (32 bytes)
 */
export declare const generateShareableToken: () => string;
/**
 * Creates a Stripe checkout session for a journey payment
 * @param journeyId - The ID of the journey to create payment for
 * @param journeyTitle - The title of the journey for the product name
 * @returns Promise<Stripe.Checkout.Session> - The created checkout session
 */
export declare const createStripeCheckoutSession: (journeyId: string, journeyTitle: string) => Promise<Stripe.Checkout.Session>;
/**
 * Verifies a Stripe webhook signature and returns the parsed event
 * @param rawBody - The raw request body from Stripe
 * @param signature - The Stripe signature header
 * @returns Promise<Stripe.Event> - The verified webhook event
 * @throws Error if signature verification fails
 */
export declare const verifyStripeWebhook: (rawBody: Buffer | string, signature: string) => Stripe.Event;
/**
 * Processes a successful payment by updating the journey status and generating a shareable token
 * @param journeyId - The ID of the journey that was paid for
 * @returns Promise<string> - The generated shareable token
 * @throws Error if journey update fails
 */
export declare const processSuccessfulPayment: (journeyId: string) => Promise<string>;
/**
 * Retrieves a Stripe checkout session and checks its payment status
 * @param sessionId - The Stripe checkout session ID
 * @returns Promise<Stripe.Checkout.Session> - The Stripe session object
 * @throws Error if session retrieval fails
 */
export declare const getStripeCheckoutSession: (sessionId: string) => Promise<Stripe.Checkout.Session>;
