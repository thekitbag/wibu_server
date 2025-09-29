import { Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../server';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { journeyId } = req.params;

    // Check if journey exists
    const journey = await prisma.journey.findUnique({
      where: { id: journeyId }
    });

    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }

    // Check if journey is already paid
    if (journey.paid) {
      return res.status(400).json({ error: 'Journey is already paid for' });
    }

    // Read the client URL from environment variables, with a fallback to the production URL
    const clientUrl = process.env.CLIENT_URL || 'https://whatiboughtyou.com';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Journey: ${journey.title}`,
              description: 'Share your thoughtful journey with someone special',
            },
            unit_amount: 500, // £5.00 in pence
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${clientUrl}/journeys/${journeyId}/success`, // Use the correct journeyId
      cancel_url: `${clientUrl}/journeys/${journeyId}`,      // Use the correct journeyId
      metadata: {
        journeyId: journeyId,
      },
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};