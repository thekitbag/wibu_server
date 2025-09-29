// Mock Stripe to avoid real API calls in tests
const mockStripeCreate = jest.fn();
const mockWebhooksConstructEvent = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: mockStripeCreate
      }
    },
    webhooks: {
      constructEvent: mockWebhooksConstructEvent
    }
  }));
});

import request from 'supertest';
import { app } from '../server';
import { prisma } from './setup';

describe('Payment API Endpoints', () => {
  beforeEach(async () => {
    await prisma.stop.deleteMany();
    await prisma.journey.deleteMany();

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set default successful responses
    mockStripeCreate.mockResolvedValue({
      id: 'cs_test_mock_session_id'
    });
    mockWebhooksConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { journeyId: 'test-id' }
        }
      }
    });
  });

  describe('POST /api/journeys/:journeyId/create-checkout-session', () => {
    it('should create a checkout session for an existing journey', async () => {
      // First create a journey
      const journey = await prisma.journey.create({
        data: { title: 'Test Journey for Payment' }
      });

      const response = await request(app)
        .post(`/api/journeys/${journey.id}/create-checkout-session`)
        .expect(200);

      expect(response.body).toHaveProperty('id', 'cs_test_mock_session_id');
    });

    it('should return 404 for non-existent journey', async () => {
      const nonExistentId = 'clfake1234567890';

      const response = await request(app)
        .post(`/api/journeys/${nonExistentId}/create-checkout-session`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Journey not found');
    });

    it('should return 400 if journey is already paid', async () => {
      // Create a paid journey
      const journey = await prisma.journey.create({
        data: {
          title: 'Already Paid Journey',
          paid: true,
          shareableToken: 'existing-token'
        }
      });

      const response = await request(app)
        .post(`/api/journeys/${journey.id}/create-checkout-session`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Journey is already paid for');
    });

    it('should handle Stripe API errors gracefully', async () => {
      // Mock Stripe to throw an error
      mockStripeCreate.mockRejectedValueOnce(new Error('Stripe API error'));

      const journey = await prisma.journey.create({
        data: { title: 'Test Journey' }
      });

      const response = await request(app)
        .post(`/api/journeys/${journey.id}/create-checkout-session`)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error');
    });
  });

  describe('POST /api/webhooks/stripe', () => {

    it('should handle checkout.session.completed event successfully', async () => {
      const journey = await prisma.journey.create({
        data: { title: 'Test Journey for Webhook' }
      });

      // Mock successful webhook verification
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: {
              journeyId: journey.id
            }
          }
        }
      };

      mockWebhooksConstructEvent.mockReturnValue(mockEvent);

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send('test_raw_body')
        .expect(200);

      expect(response.body).toHaveProperty('received', true);

      // Verify journey was updated
      const updatedJourney = await prisma.journey.findUnique({
        where: { id: journey.id }
      });

      expect(updatedJourney?.paid).toBe(true);
      expect(updatedJourney?.shareableToken).toBeTruthy();
      expect(updatedJourney?.shareableToken).toHaveLength(64); // 32 bytes as hex = 64 chars
    });

    it('should return 400 when stripe-signature header is missing', async () => {
      const response = await request(app)
        .post('/api/webhooks/stripe')
        .send('test_raw_body')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing stripe-signature header');
    });

    it('should return 400 when webhook signature verification fails', async () => {
      mockWebhooksConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'invalid_signature')
        .send('test_raw_body')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid signature');
    });

    it('should return 400 when journeyId is missing from metadata', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: {} // No journeyId
          }
        }
      };

      mockWebhooksConstructEvent.mockReturnValue(mockEvent);

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send('test_raw_body')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'No journeyId in metadata');
    });

    it('should handle unrecognized event types gracefully', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded', // Different event type
        data: {
          object: {}
        }
      };

      mockWebhooksConstructEvent.mockReturnValue(mockEvent);

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send('test_raw_body')
        .expect(200);

      expect(response.body).toHaveProperty('received', true);
    });

    it('should handle database errors when updating journey', async () => {
      // Use an invalid journey ID that won't be found
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: {
              journeyId: 'invalid-journey-id'
            }
          }
        }
      };

      mockWebhooksConstructEvent.mockReturnValue(mockEvent);

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send('test_raw_body')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to update journey');
    });
  });

  describe('Updated Journey Retrieval with Payment Info', () => {
    it('should return journey with paid=false and no shareableToken for unpaid journey', async () => {
      const journey = await prisma.journey.create({
        data: { title: 'Unpaid Journey' }
      });

      const response = await request(app)
        .get(`/api/journeys/${journey.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', journey.id);
      expect(response.body).toHaveProperty('title', 'Unpaid Journey');
      expect(response.body).toHaveProperty('paid', false);
      expect(response.body).not.toHaveProperty('shareableToken');
      expect(response.body).toHaveProperty('stops', []);
    });

    it('should return journey with paid=true and shareableToken for paid journey', async () => {
      const journey = await prisma.journey.create({
        data: {
          title: 'Paid Journey',
          paid: true,
          shareableToken: 'test-shareable-token-123'
        }
      });

      const response = await request(app)
        .get(`/api/journeys/${journey.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', journey.id);
      expect(response.body).toHaveProperty('title', 'Paid Journey');
      expect(response.body).toHaveProperty('paid', true);
      expect(response.body).toHaveProperty('shareableToken', 'test-shareable-token-123');
      expect(response.body).toHaveProperty('stops', []);
    });

    it('should not return shareableToken if journey is paid but token is null', async () => {
      const journey = await prisma.journey.create({
        data: {
          title: 'Paid Journey Without Token',
          paid: true,
          shareableToken: null
        }
      });

      const response = await request(app)
        .get(`/api/journeys/${journey.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('paid', true);
      expect(response.body).not.toHaveProperty('shareableToken');
    });
  });

  describe('Integration: Payment Flow End-to-End', () => {
    it('should create journey, create checkout session, process webhook, and retrieve paid journey', async () => {
      // Step 1: Create a journey
      const journeyResponse = await request(app)
        .post('/api/journeys')
        .send({ title: 'Integration Test Journey' })
        .expect(201);

      const journeyId = journeyResponse.body.id;

      // Step 2: Create checkout session
      const checkoutResponse = await request(app)
        .post(`/api/journeys/${journeyId}/create-checkout-session`)
        .expect(200);

      expect(checkoutResponse.body).toHaveProperty('id', 'cs_test_mock_session_id');

      // Step 3: Simulate successful payment webhook
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: {
              journeyId: journeyId
            }
          }
        }
      };

      mockWebhooksConstructEvent.mockReturnValue(mockEvent);

      await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send('test_raw_body')
        .expect(200);

      // Step 4: Retrieve updated journey
      const finalResponse = await request(app)
        .get(`/api/journeys/${journeyId}`)
        .expect(200);

      expect(finalResponse.body).toHaveProperty('title', 'Integration Test Journey');
      expect(finalResponse.body).toHaveProperty('paid', true);
      expect(finalResponse.body).toHaveProperty('shareableToken');
      expect(typeof finalResponse.body.shareableToken).toBe('string');
      expect(finalResponse.body.shareableToken.length).toBe(64);
    });
  });
});