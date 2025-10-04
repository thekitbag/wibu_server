import request from 'supertest';
import { app } from '../server';
import { prisma } from './setup';

describe('Journey Reveal API Endpoints', () => {
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
  });

  describe('GET /api/reveal/:shareableToken', () => {
    it('should successfully reveal a paid journey with valid token', async () => {
      // Create a paid journey with shareable token
      const journey = await prisma.journey.create({
        data: {
          title: 'Paid Journey for Reveal',
          paid: true,
          shareableToken: 'valid-test-token-123'
        }
      });

      // Add some stops to the journey
      await prisma.stop.createMany({
        data: [
          {
            title: 'First Stop',
            note: 'First stop note',
            image_url: 'https://example.com/image1.jpg',
            external_url: 'https://hotel.example.com',
            order: 1,
            journeyId: journey.id
          },
          {
            title: 'Second Stop',
            note: 'Second stop note',
            image_url: 'https://example.com/image2.jpg',
            external_url: null,
            order: 2,
            journeyId: journey.id
          }
        ]
      });

      const response = await request(app)
        .get('/api/reveal/valid-test-token-123')
        .expect(200);

      expect(response.body).toHaveProperty('id', journey.id);
      expect(response.body).toHaveProperty('title', 'Paid Journey for Reveal');
      expect(response.body).toHaveProperty('paid', true);
      expect(response.body).toHaveProperty('stops');
      expect(response.body.stops).toHaveLength(2);

      // Verify stops are ordered correctly
      expect(response.body.stops[0]).toHaveProperty('title', 'First Stop');
      expect(response.body.stops[0]).toHaveProperty('order', 1);
      expect(response.body.stops[1]).toHaveProperty('title', 'Second Stop');
      expect(response.body.stops[1]).toHaveProperty('order', 2);

      // Verify external_url field is present and correct
      expect(response.body.stops[0]).toHaveProperty('external_url', 'https://hotel.example.com');
      expect(response.body.stops[1]).toHaveProperty('external_url', null);

      // Verify all stop fields are present
      response.body.stops.forEach((stop: { id: string; title: string; note: string | null; image_url: string | null; icon_name: string | null; external_url: string | null; order: number }) => {
        expect(stop).toHaveProperty('id');
        expect(stop).toHaveProperty('title');
        expect(stop).toHaveProperty('note');
        expect(stop).toHaveProperty('image_url');
        expect(stop).toHaveProperty('icon_name');
        expect(stop).toHaveProperty('external_url');
        expect(stop).toHaveProperty('order');
      });

      // Verify shareable token is NOT included in response (security)
      expect(response.body).not.toHaveProperty('shareableToken');
    });

    it('should return 404 for unpaid journey even with valid token', async () => {
      // Create an unpaid journey with shareable token
      await prisma.journey.create({
        data: {
          title: 'Unpaid Journey',
          paid: false,
          shareableToken: 'unpaid-journey-token'
        }
      });

      const response = await request(app)
        .get('/api/reveal/unpaid-journey-token')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Journey not found');
    });

    it('should return 404 for non-existent token', async () => {
      const response = await request(app)
        .get('/api/reveal/non-existent-token')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Journey not found');
    });

    it('should return 404 for paid journey with null token', async () => {
      // Create a paid journey but with null shareable token
      await prisma.journey.create({
        data: {
          title: 'Paid Journey with Null Token',
          paid: true,
          shareableToken: null
        }
      });

      const response = await request(app)
        .get('/api/reveal/some-random-token')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Journey not found');
    });

    it('should handle empty stops array correctly', async () => {
      // Create a paid journey with no stops
      const journey = await prisma.journey.create({
        data: {
          title: 'Empty Journey',
          paid: true,
          shareableToken: 'empty-journey-token'
        }
      });

      const response = await request(app)
        .get('/api/reveal/empty-journey-token')
        .expect(200);

      expect(response.body).toHaveProperty('id', journey.id);
      expect(response.body).toHaveProperty('title', 'Empty Journey');
      expect(response.body).toHaveProperty('paid', true);
      expect(response.body).toHaveProperty('stops', []);
    });

    it('should return stops in correct order even if created out of order', async () => {
      // Create a paid journey
      const journey = await prisma.journey.create({
        data: {
          title: 'Ordered Journey',
          paid: true,
          shareableToken: 'ordered-journey-token'
        }
      });

      // Create stops out of order to test ordering
      await prisma.stop.createMany({
        data: [
          {
            title: 'Third Stop',
            note: 'Should be third',
            image_url: 'https://example.com/image3.jpg',
            order: 3,
            journeyId: journey.id
          },
          {
            title: 'First Stop',
            note: 'Should be first',
            image_url: 'https://example.com/image1.jpg',
            order: 1,
            journeyId: journey.id
          },
          {
            title: 'Second Stop',
            note: 'Should be second',
            image_url: 'https://example.com/image2.jpg',
            order: 2,
            journeyId: journey.id
          }
        ]
      });

      const response = await request(app)
        .get('/api/reveal/ordered-journey-token')
        .expect(200);

      expect(response.body.stops).toHaveLength(3);
      expect(response.body.stops[0]).toHaveProperty('title', 'First Stop');
      expect(response.body.stops[0]).toHaveProperty('order', 1);
      expect(response.body.stops[1]).toHaveProperty('title', 'Second Stop');
      expect(response.body.stops[1]).toHaveProperty('order', 2);
      expect(response.body.stops[2]).toHaveProperty('title', 'Third Stop');
      expect(response.body.stops[2]).toHaveProperty('order', 3);
    });
  });
});