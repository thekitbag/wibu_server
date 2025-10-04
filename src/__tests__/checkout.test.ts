// Mock Stripe SDK before importing other modules
const mockStripeSessionRetrieve = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        retrieve: mockStripeSessionRetrieve
      }
    }
  }));
});

import request from 'supertest';
import { app } from '../server';
import { prisma } from './setup';

describe('Checkout Session Status API Endpoints', () => {
  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.stop.deleteMany({
      where: {
        journey: {
          id: {
            not: 'demo-journey-id' // Preserve demo journey stops
          }
        }
      }
    });
    await prisma.journey.deleteMany({
      where: {
        id: {
          not: 'demo-journey-id' // Preserve demo journey
        }
      }
    });

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/checkout-session/:sessionId', () => {
    it('should return complete status with journey data for paid session', async () => {
      // Create a paid journey with shareable token (simulating webhook completion)
      const journey = await prisma.journey.create({
        data: {
          title: 'Paid Journey',
          paid: true,
          shareableToken: 'test-shareable-token-123'
        }
      });

      // Add some stops to the journey
      await prisma.stop.createMany({
        data: [
          {
            title: 'First Stop',
            note: 'First note',
            image_url: 'https://example.com/image1.jpg',
            order: 1,
            journeyId: journey.id
          },
          {
            title: 'Second Stop',
            note: 'Second note',
            image_url: 'https://example.com/image2.jpg',
            order: 2,
            journeyId: journey.id
          }
        ]
      });

      // Mock Stripe session retrieve to return a paid session
      mockStripeSessionRetrieve.mockResolvedValue({
        id: 'cs_test_session_123',
        payment_status: 'paid',
        metadata: {
          journeyId: journey.id
        }
      });

      const response = await request(app)
        .get('/api/checkout-session/cs_test_session_123')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'complete');
      expect(response.body).toHaveProperty('journey');
      expect(response.body.journey).toHaveProperty('id', journey.id);
      expect(response.body.journey).toHaveProperty('title', 'Paid Journey');
      expect(response.body.journey).toHaveProperty('paid', true);
      expect(response.body.journey).toHaveProperty('shareableToken', 'test-shareable-token-123');
      expect(response.body.journey).toHaveProperty('stops');
      expect(response.body.journey.stops).toHaveLength(2);

      // Verify stops are ordered correctly
      expect(response.body.journey.stops[0]).toHaveProperty('title', 'First Stop');
      expect(response.body.journey.stops[0]).toHaveProperty('order', 1);
      expect(response.body.journey.stops[1]).toHaveProperty('title', 'Second Stop');
      expect(response.body.journey.stops[1]).toHaveProperty('order', 2);

      // Verify Stripe session was retrieved with correct ID
      expect(mockStripeSessionRetrieve).toHaveBeenCalledWith('cs_test_session_123');
    });

    it('should return processing status for unpaid session', async () => {
      // Mock Stripe session retrieve to return an unpaid session
      mockStripeSessionRetrieve.mockResolvedValue({
        id: 'cs_test_unpaid_session',
        payment_status: 'unpaid',
        metadata: {
          journeyId: 'some-journey-id'
        }
      });

      const response = await request(app)
        .get('/api/checkout-session/cs_test_unpaid_session')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'processing');
      expect(response.body).not.toHaveProperty('journey');

      // Verify Stripe session was retrieved with correct ID
      expect(mockStripeSessionRetrieve).toHaveBeenCalledWith('cs_test_unpaid_session');
    });

    it('should return 404 for non-existent session ID', async () => {
      // Mock Stripe to throw a "resource missing" error
      const stripeError = Object.assign(new Error('No such checkout session: cs_nonexistent'), {
        type: 'StripeInvalidRequestError',
        code: 'resource_missing'
      });

      mockStripeSessionRetrieve.mockRejectedValue(stripeError);

      const response = await request(app)
        .get('/api/checkout-session/cs_nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Checkout session not found');
      expect(mockStripeSessionRetrieve).toHaveBeenCalledWith('cs_nonexistent');
    });

    it('should return 500 when session has no journeyId in metadata', async () => {
      // Mock Stripe session with missing journeyId in metadata
      mockStripeSessionRetrieve.mockResolvedValue({
        id: 'cs_test_no_metadata',
        payment_status: 'paid',
        metadata: {} // No journeyId
      });

      const response = await request(app)
        .get('/api/checkout-session/cs_test_no_metadata')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Invalid session metadata');
    });

    it('should return 500 when journey is not found in database', async () => {
      // Mock Stripe session with valid metadata but non-existent journey
      mockStripeSessionRetrieve.mockResolvedValue({
        id: 'cs_test_missing_journey',
        payment_status: 'paid',
        metadata: {
          journeyId: 'non-existent-journey-id'
        }
      });

      const response = await request(app)
        .get('/api/checkout-session/cs_test_missing_journey')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Journey not found');
    });

    it('should handle journey without shareable token correctly', async () => {
      // Create a paid journey but without shareable token (edge case)
      const journey = await prisma.journey.create({
        data: {
          title: 'Paid Journey No Token',
          paid: true,
          shareableToken: null
        }
      });

      // Mock Stripe session retrieve
      mockStripeSessionRetrieve.mockResolvedValue({
        id: 'cs_test_no_token',
        payment_status: 'paid',
        metadata: {
          journeyId: journey.id
        }
      });

      const response = await request(app)
        .get('/api/checkout-session/cs_test_no_token')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'complete');
      expect(response.body).toHaveProperty('journey');
      expect(response.body.journey).toHaveProperty('id', journey.id);
      expect(response.body.journey).toHaveProperty('paid', true);
      expect(response.body.journey).not.toHaveProperty('shareableToken');
    });

    it('should handle other Stripe errors with 500 status', async () => {
      // Mock Stripe to throw a general error
      const stripeError = Object.assign(new Error('API connection failed'), {
        type: 'StripeConnectionError'
      });

      mockStripeSessionRetrieve.mockRejectedValue(stripeError);

      const response = await request(app)
        .get('/api/checkout-session/cs_test_error')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error');
    });

    it('should return empty stops array for journey without stops', async () => {
      // Create a paid journey with no stops
      const journey = await prisma.journey.create({
        data: {
          title: 'Empty Journey',
          paid: true,
          shareableToken: 'empty-journey-token'
        }
      });

      // Mock Stripe session retrieve
      mockStripeSessionRetrieve.mockResolvedValue({
        id: 'cs_test_empty_journey',
        payment_status: 'paid',
        metadata: {
          journeyId: journey.id
        }
      });

      const response = await request(app)
        .get('/api/checkout-session/cs_test_empty_journey')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'complete');
      expect(response.body.journey).toHaveProperty('stops', []);
    });
  });
});