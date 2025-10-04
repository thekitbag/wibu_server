import { Request, Response } from 'express';
import { prisma } from '../server';
import { getStripeCheckoutSession } from '../services/paymentService';

/**
 * Checks the status of a Stripe checkout session and returns journey data if payment is complete
 * Solves race condition between user redirect and webhook processing
 */
export const checkCheckoutSessionStatus = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    // Retrieve the checkout session from Stripe
    const stripeSession = await getStripeCheckoutSession(sessionId);

    // Check if payment has been completed
    if (stripeSession.payment_status === 'paid') {
      // Extract journey ID from session metadata
      const journeyId = stripeSession.metadata?.journeyId;

      if (!journeyId) {
        console.error('No journeyId found in Stripe session metadata');
        return res.status(500).json({ error: 'Invalid session metadata' });
      }

      // Fetch the updated journey from our database (should have been updated by webhook)
      const journey = await prisma.journey.findUnique({
        where: { id: journeyId },
        include: {
          stops: {
            orderBy: {
              order: 'asc' // Ensure stops are returned in correct sequence
            }
          }
        }
      });

      if (!journey) {
        console.error(`Journey ${journeyId} not found after payment completion`);
        return res.status(500).json({ error: 'Journey not found' });
      }

      // Return complete status with full journey data
      const response: {
        status: string;
        journey: {
          id: string;
          title: string;
          paid: boolean;
          stops: Array<{
            id: string;
            title: string;
            note: string | null;
            image_url: string | null;
            icon_name: string | null;
            external_url: string | null;
            order: number;
          }>;
          shareableToken?: string;
        };
      } = {
        status: 'complete',
        journey: {
          id: journey.id,
          title: journey.title,
          paid: journey.paid,
          stops: journey.stops.map(stop => ({
            id: stop.id,
            title: stop.title,
            note: stop.note,
            image_url: stop.image_url,
            icon_name: stop.icon_name,
            external_url: stop.external_url,
            order: stop.order
          }))
        }
      };

      // Include shareable token if available (should be set by webhook)
      if (journey.shareableToken) {
        response.journey.shareableToken = journey.shareableToken;
      }

      res.json(response);
    } else {
      // Payment is still processing or failed
      res.json({ status: 'processing' });
    }
  } catch (error: unknown) {
    console.error('Error checking checkout session status:', error);

    // Check if this is a Stripe "not found" error
    if (error && typeof error === 'object' && 'type' in error && 'code' in error &&
        error.type === 'StripeInvalidRequestError' && error.code === 'resource_missing') {
      return res.status(404).json({ error: 'Checkout session not found' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};