import { Request, Response } from 'express';
import Stripe from 'stripe';
import { verifyStripeWebhook, processSuccessfulPayment } from '../services/paymentService';

/**
 * Handles incoming Stripe webhook events
 * Processes payment completion events and updates journey payment status
 */
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  // Validate required signature header
  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature using payment service
    // Convert signature header to string if it's an array
    const signatureString = Array.isArray(sig) ? sig[0] : sig;
    event = verifyStripeWebhook(req.body, signatureString);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Process different webhook event types
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      // Extract journey ID from Stripe session metadata
      const journeyId = session.metadata?.journeyId;

      if (!journeyId) {
        console.error('No journeyId found in session metadata');
        return res.status(400).json({ error: 'No journeyId in metadata' });
      }

      try {
        // Process the successful payment using payment service
        const shareableToken = await processSuccessfulPayment(journeyId);
        console.log(`Journey ${journeyId} marked as paid with token ${shareableToken}`);
      } catch (error) {
        console.error('Error updating journey after payment:', error);
        return res.status(500).json({ error: 'Failed to update journey' });
      }
      break;
    }
    default:
      // Log unhandled event types for monitoring
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Acknowledge successful receipt of the webhook
  res.json({ received: true });
};