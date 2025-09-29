import { Request, Response } from 'express';
import Stripe from 'stripe';
import { randomBytes } from 'crypto';
import { prisma } from '../server';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const generateShareableToken = (): string => {
  return randomBytes(32).toString('hex');
};

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      // Get journeyId from metadata
      const journeyId = session.metadata?.journeyId;

      if (!journeyId) {
        console.error('No journeyId found in session metadata');
        return res.status(400).json({ error: 'No journeyId in metadata' });
      }

      try {
        // Generate unique shareable token
        const shareableToken = generateShareableToken();

        // Update journey with payment status and shareable token
        await prisma.journey.update({
          where: { id: journeyId },
          data: {
            paid: true,
            shareableToken: shareableToken,
          },
        });

        console.log(`Journey ${journeyId} marked as paid with token ${shareableToken}`);
      } catch (error) {
        console.error('Error updating journey after payment:', error);
        return res.status(500).json({ error: 'Failed to update journey' });
      }
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
};