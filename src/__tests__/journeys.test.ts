import request from 'supertest';
import { app } from '../server';
import { prisma } from './setup';

describe('Journey API Endpoints', () => {
  beforeEach(async () => {
    await prisma.stop.deleteMany();
    await prisma.journey.deleteMany();
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