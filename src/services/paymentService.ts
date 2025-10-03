import Stripe from 'stripe';
import { randomBytes } from 'crypto';
import { prisma } from '../server';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Generates a cryptographically secure random token for shareable journey links
 * @returns A 64-character hexadecimal string (32 bytes)
 */
export const generateShareableToken = (): string => {
  return randomBytes(32).toString('hex');
};

/**
 * Creates a Stripe checkout session for a journey payment
 * @param journeyId - The ID of the journey to create payment for
 * @param journeyTitle - The title of the journey for the product name
 * @returns Promise<Stripe.Checkout.Session> - The created checkout session
 */
export const createStripeCheckoutSession = async (
  journeyId: string,
  journeyTitle: string
): Promise<Stripe.Checkout.Session> => {
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

/**
 * Verifies a Stripe webhook signature and returns the parsed event
 * @param rawBody - The raw request body from Stripe
 * @param signature - The Stripe signature header
 * @returns Promise<Stripe.Event> - The verified webhook event
 * @throws Error if signature verification fails
 */
export const verifyStripeWebhook = (
  rawBody: Buffer | string,
  signature: string
): Stripe.Event => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
  }

  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
};

/**
 * Processes a successful payment by updating the journey status and generating a shareable token
 * @param journeyId - The ID of the journey that was paid for
 * @returns Promise<string> - The generated shareable token
 * @throws Error if journey update fails
 */
export const processSuccessfulPayment = async (journeyId: string): Promise<string> => {
  // Generate unique shareable token for the paid journey
  const shareableToken = generateShareableToken();

  // Update journey with payment status and shareable token
  await prisma.journey.update({
    where: { id: journeyId },
    data: {
      paid: true,
      shareableToken: shareableToken,
    },
  });

  return shareableToken;
};

/**
 * Retrieves a Stripe checkout session and checks its payment status
 * @param sessionId - The Stripe checkout session ID
 * @returns Promise<Stripe.Checkout.Session> - The Stripe session object
 * @throws Error if session retrieval fails
 */
export const getStripeCheckoutSession = async (sessionId: string): Promise<Stripe.Checkout.Session> => {
  return await stripe.checkout.sessions.retrieve(sessionId);
};