import request from 'supertest';
import { app } from '../server';
import { prisma } from './setup';

describe('Journey API Endpoints', () => {
  beforeEach(async () => {
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
  describe('POST /api/journeys', () => {
    it('should create a new journey with valid title', async () => {
      const journeyData = { title: 'My Test Journey' };

      const response = await request(app)
        .post('/api/journeys')
        .send(journeyData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'My Test Journey');
      expect(typeof response.body.id).toBe('string');
      expect(response.body.id.length).toBeGreaterThan(0);

      const journeyInDb = await prisma.journey.findUnique({
        where: { id: response.body.id }
      });
      expect(journeyInDb).toBeTruthy();
      expect(journeyInDb?.title).toBe('My Test Journey');
    });

    it('should return 400 when title is missing', async () => {
      const response = await request(app)
        .post('/api/journeys')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Title is required');
    });

    it('should return 400 when title is null', async () => {
      const response = await request(app)
        .post('/api/journeys')
        .send({ title: null })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Title is required');
    });

    it('should return 400 when title is empty string', async () => {
      const response = await request(app)
        .post('/api/journeys')
        .send({ title: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Title is required');
    });

    it('should handle special characters in title', async () => {
      const journeyData = { title: 'Journey with special chars: áéíóú & symbols @#$%' };

      const response = await request(app)
        .post('/api/journeys')
        .send(journeyData)
        .expect(201);

      expect(response.body.title).toBe('Journey with special chars: áéíóú & symbols @#$%');
    });

    it('should handle long titles', async () => {
      const longTitle = 'A'.repeat(500);
      const journeyData = { title: longTitle };

      const response = await request(app)
        .post('/api/journeys')
        .send(journeyData)
        .expect(201);

      expect(response.body.title).toBe(longTitle);
    });

    it('should ignore extra fields in request body', async () => {
      const journeyData = {
        title: 'Test Journey',
        extraField: 'should be ignored',
        anotherField: 123
      };

      const response = await request(app)
        .post('/api/journeys')
        .send(journeyData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'Test Journey');
      expect(response.body).not.toHaveProperty('extraField');
      expect(response.body).not.toHaveProperty('anotherField');
    });
  });

  describe('GET /api/journeys/:id', () => {
    it('should return a journey by ID', async () => {
      const journey = await prisma.journey.create({
        data: { title: 'Test Journey for GET' }
      });

      const response = await request(app)
        .get(`/api/journeys/${journey.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', journey.id);
      expect(response.body).toHaveProperty('title', 'Test Journey for GET');
    });

    it('should return 404 for non-existent journey ID', async () => {
      const nonExistentId = 'clfake1234567890';

      const response = await request(app)
        .get(`/api/journeys/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Journey not found');
    });

    it('should handle malformed ID gracefully', async () => {
      const malformedId = 'invalid-id-format';

      const response = await request(app)
        .get(`/api/journeys/${malformedId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Journey not found');
    });
  });

  describe('Integration: Create and Retrieve Journey', () => {
    it('should create a journey and then retrieve it', async () => {
      const journeyData = { title: 'Integration Test Journey' };

      const createResponse = await request(app)
        .post('/api/journeys')
        .send(journeyData)
        .expect(201);

      const createdJourneyId = createResponse.body.id;

      const getResponse = await request(app)
        .get(`/api/journeys/${createdJourneyId}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty('id', createdJourneyId);
      expect(getResponse.body).toHaveProperty('title', 'Integration Test Journey');
    });
  });

  describe('GET /api/journeys/public/:journeyId', () => {
    it('should return public summary for existing journey', async () => {
      const journey = await prisma.journey.create({
        data: { title: 'Public Journey Test' }
      });

      await prisma.stop.create({
        data: {
          title: 'First Stop',
          note: 'Private note',
          image_url: 'https://example.com/image.jpg',
          external_url: 'https://private-link.com',
          order: 1,
          journeyId: journey.id
        }
      });

      const response = await request(app)
        .get(`/api/journeys/public/${journey.id}`)
        .expect(200);

      expect(response.body).toEqual({
        journeyTitle: 'Public Journey Test',
        heroImageUrl: 'https://example.com/image.jpg',
        highlights: ['First Stop']
      });

      expect(response.body).not.toHaveProperty('id');
      expect(response.body).not.toHaveProperty('paid');
      expect(response.body).not.toHaveProperty('stops');
      expect(response.body).not.toHaveProperty('note');
      expect(response.body).not.toHaveProperty('external_url');
    });

    it('should return 404 for non-existent journey', async () => {
      const nonExistentId = 'clfake1234567890';

      const response = await request(app)
        .get(`/api/journeys/public/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Journey not found');
    });

    it('should handle journey with multiple stops correctly', async () => {
      const journey = await prisma.journey.create({
        data: { title: 'Multi-Stop Journey' }
      });

      await prisma.stop.createMany({
        data: [
          {
            title: 'Second Stop',
            note: 'Private note 2',
            image_url: null,
            icon_name: 'Restaurant',
            external_url: 'https://restaurant.com',
            order: 2,
            journeyId: journey.id
          },
          {
            title: 'First Stop',
            note: 'Private note 1',
            image_url: 'https://example.com/hero.jpg',
            external_url: 'https://first.com',
            order: 1,
            journeyId: journey.id
          },
          {
            title: 'Third Stop',
            note: 'Private note 3',
            image_url: 'https://example.com/third.jpg',
            external_url: 'https://third.com',
            order: 3,
            journeyId: journey.id
          }
        ]
      });

      const response = await request(app)
        .get(`/api/journeys/public/${journey.id}`)
        .expect(200);

      expect(response.body).toEqual({
        journeyTitle: 'Multi-Stop Journey',
        heroImageUrl: 'https://example.com/hero.jpg',
        highlights: ['First Stop', 'Second Stop', 'Third Stop']
      });
    });

    it('should handle journey with no stops', async () => {
      const journey = await prisma.journey.create({
        data: { title: 'Empty Journey' }
      });

      const response = await request(app)
        .get(`/api/journeys/public/${journey.id}`)
        .expect(200);

      expect(response.body).toEqual({
        journeyTitle: 'Empty Journey',
        heroImageUrl: null,
        highlights: []
      });
    });

    it('should handle malformed journey ID gracefully', async () => {
      const malformedId = 'invalid-id-format';

      const response = await request(app)
        .get(`/api/journeys/public/${malformedId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Journey not found');
    });

    it('should return correctly sanitized data without private information', async () => {
      const journey = await prisma.journey.create({
        data: {
          title: 'Privacy Test Journey',
          paid: true,
          shareableToken: 'secret-token-123'
        }
      });

      await prisma.stop.create({
        data: {
          title: 'Public Stop Title',
          note: 'This is very private and personal information',
          image_url: 'https://example.com/public.jpg',
          icon_name: null,
          external_url: 'https://private-booking-link.com',
          order: 1,
          journeyId: journey.id
        }
      });

      const response = await request(app)
        .get(`/api/journeys/public/${journey.id}`)
        .expect(200);

      const resultString = JSON.stringify(response.body);
      expect(resultString).not.toContain('private');
      expect(resultString).not.toContain('personal');
      expect(resultString).not.toContain('secret-token');
      expect(resultString).not.toContain('private-booking-link');
      expect(resultString).not.toContain('paid');

      expect(Object.keys(response.body)).toEqual(['journeyTitle', 'heroImageUrl', 'highlights']);
    });
  });

  describe('Content-Type and Headers', () => {
    it('should handle malformed JSON gracefully', async () => {
      await request(app)
        .post('/api/journeys')
        .set('Content-Type', 'text/plain')
        .send('{"title": "Test"}')
        .expect(500);
    });

    it('should return JSON content type', async () => {
      const journeyData = { title: 'Content Type Test' };

      const response = await request(app)
        .post('/api/journeys')
        .send(journeyData)
        .expect(201);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});