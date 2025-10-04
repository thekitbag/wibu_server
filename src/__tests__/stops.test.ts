import request from 'supertest';
import { app } from '../server';
import { prisma } from './setup';

describe('Stops API Endpoints', () => {
  let testJourney: { id: string; title: string };

  beforeEach(async () => {
    // Clean up first
    await prisma.stop.deleteMany();
    await prisma.journey.deleteMany();

    // Then create a test journey for each test
    testJourney = await prisma.journey.create({
      data: { title: 'Test Journey for Stops' }
    });
  });

  describe('POST /api/journeys/:journeyId/stops', () => {
    it('should create a new stop with valid data', async () => {
      const stopData = {
        title: 'First Stop',
        note: 'This is a test stop',
        image_url: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post(`/api/journeys/${testJourney.id}/stops`)
        .send(stopData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'First Stop');
      expect(response.body).toHaveProperty('note', 'This is a test stop');
      expect(response.body).toHaveProperty('image_url', 'https://example.com/image.jpg');
      expect(response.body).toHaveProperty('external_url', null);
      expect(response.body).toHaveProperty('order', 1);
      expect(response.body).toHaveProperty('journeyId', testJourney.id);
      expect(typeof response.body.id).toBe('string');
      expect(response.body.id.length).toBeGreaterThan(0);

      // Verify stop was created in database
      const stopInDb = await prisma.stop.findUnique({
        where: { id: response.body.id }
      });
      expect(stopInDb).toBeTruthy();
      expect(stopInDb?.title).toBe('First Stop');
      expect(stopInDb?.order).toBe(1);
      expect(stopInDb?.external_url).toBe(null);
    });

    it('should automatically assign correct order for multiple stops', async () => {
      const stopData1 = {
        title: 'First Stop',
        image_url: 'https://example.com/image1.jpg'
      };
      const stopData2 = {
        title: 'Second Stop',
        image_url: 'https://example.com/image2.jpg'
      };

      const response1 = await request(app)
        .post(`/api/journeys/${testJourney.id}/stops`)
        .send(stopData1)
        .expect(201);

      const response2 = await request(app)
        .post(`/api/journeys/${testJourney.id}/stops`)
        .send(stopData2)
        .expect(201);

      expect(response1.body.order).toBe(1);
      expect(response2.body.order).toBe(2);
    });

    it('should create stop without note (optional field)', async () => {
      const stopData = {
        title: 'Stop without note',
        image_url: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post(`/api/journeys/${testJourney.id}/stops`)
        .send(stopData)
        .expect(201);

      expect(response.body).toHaveProperty('title', 'Stop without note');
      expect(response.body).toHaveProperty('note', null);
      expect(response.body).toHaveProperty('image_url', 'https://example.com/image.jpg');
      expect(response.body).toHaveProperty('external_url', null);
    });

    it('should create stop with external_url when provided', async () => {
      const stopData = {
        title: 'Hotel Stop',
        note: 'Stay at this amazing hotel',
        image_url: 'https://example.com/hotel.jpg',
        external_url: 'https://hotel-booking.com/reservation'
      };

      const response = await request(app)
        .post(`/api/journeys/${testJourney.id}/stops`)
        .send(stopData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'Hotel Stop');
      expect(response.body).toHaveProperty('note', 'Stay at this amazing hotel');
      expect(response.body).toHaveProperty('image_url', 'https://example.com/hotel.jpg');
      expect(response.body).toHaveProperty('external_url', 'https://hotel-booking.com/reservation');
      expect(response.body).toHaveProperty('order', 1);
      expect(response.body).toHaveProperty('journeyId', testJourney.id);

      // Verify external_url was saved in database
      const stopInDb = await prisma.stop.findUnique({
        where: { id: response.body.id }
      });
      expect(stopInDb?.external_url).toBe('https://hotel-booking.com/reservation');
    });

    it('should create stop without external_url (optional field)', async () => {
      const stopData = {
        title: 'Stop without external URL',
        image_url: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post(`/api/journeys/${testJourney.id}/stops`)
        .send(stopData)
        .expect(201);

      expect(response.body).toHaveProperty('title', 'Stop without external URL');
      expect(response.body).toHaveProperty('external_url', null);

      // Verify external_url is null in database
      const stopInDb = await prisma.stop.findUnique({
        where: { id: response.body.id }
      });
      expect(stopInDb?.external_url).toBe(null);
    });

    it('should automatically prepend https:// to external_url when missing protocol', async () => {
      const stopData = {
        title: 'Hotel with URL needing https',
        note: 'Test URL formatting',
        image_url: 'https://example.com/hotel.jpg',
        external_url: 'hotel-booking.com/reservation'
      };

      const response = await request(app)
        .post(`/api/journeys/${testJourney.id}/stops`)
        .send(stopData)
        .expect(201);

      expect(response.body).toHaveProperty('external_url', 'https://hotel-booking.com/reservation');

      // Verify formatted URL was saved in database
      const stopInDb = await prisma.stop.findUnique({
        where: { id: response.body.id }
      });
      expect(stopInDb?.external_url).toBe('https://hotel-booking.com/reservation');
    });

    it('should preserve existing https:// protocol in external_url', async () => {
      const stopData = {
        title: 'Restaurant with https URL',
        image_url: 'https://example.com/restaurant.jpg',
        external_url: 'https://restaurant.com/book'
      };

      const response = await request(app)
        .post(`/api/journeys/${testJourney.id}/stops`)
        .send(stopData)
        .expect(201);

      expect(response.body).toHaveProperty('external_url', 'https://restaurant.com/book');

      // Verify URL was not modified in database
      const stopInDb = await prisma.stop.findUnique({
        where: { id: response.body.id }
      });
      expect(stopInDb?.external_url).toBe('https://restaurant.com/book');
    });

    it('should preserve existing http:// protocol in external_url', async () => {
      const stopData = {
        title: 'Local service with http URL',
        image_url: 'https://example.com/service.jpg',
        external_url: 'http://local-service.com/contact'
      };

      const response = await request(app)
        .post(`/api/journeys/${testJourney.id}/stops`)
        .send(stopData)
        .expect(201);

      expect(response.body).toHaveProperty('external_url', 'http://local-service.com/contact');

      // Verify URL was not modified in database
      const stopInDb = await prisma.stop.findUnique({
        where: { id: response.body.id }
      });
      expect(stopInDb?.external_url).toBe('http://local-service.com/contact');
    });

    it('should handle empty external_url as null', async () => {
      const stopData = {
        title: 'Stop with empty URL',
        image_url: 'https://example.com/image.jpg',
        external_url: ''
      };

      const response = await request(app)
        .post(`/api/journeys/${testJourney.id}/stops`)
        .send(stopData)
        .expect(201);

      expect(response.body).toHaveProperty('external_url', null);

      // Verify empty string was converted to null in database
      const stopInDb = await prisma.stop.findUnique({
        where: { id: response.body.id }
      });
      expect(stopInDb?.external_url).toBe(null);
    });

    it('should trim whitespace and add https:// to external_url', async () => {
      const stopData = {
        title: 'Stop with URL needing trim',
        image_url: 'https://example.com/image.jpg',
        external_url: '  example.com/page  '
      };

      const response = await request(app)
        .post(`/api/journeys/${testJourney.id}/stops`)
        .send(stopData)
        .expect(201);

      expect(response.body).toHaveProperty('external_url', 'https://example.com/page');

      // Verify trimmed and formatted URL in database
      const stopInDb = await prisma.stop.findUnique({
        where: { id: response.body.id }
      });
      expect(stopInDb?.external_url).toBe('https://example.com/page');
    });

    it('should return 400 when title is missing', async () => {
      const stopData = {
        image_url: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post(`/api/journeys/${testJourney.id}/stops`)
        .send(stopData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Title is required');
    });

    it('should return 400 when title is empty string', async () => {
      const stopData = {
        title: '',
        image_url: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post(`/api/journeys/${testJourney.id}/stops`)
        .send(stopData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Title is required');
    });

    it('should return 400 when image_url is missing', async () => {
      const stopData = {
        title: 'Test Stop'
      };

      const response = await request(app)
        .post(`/api/journeys/${testJourney.id}/stops`)
        .send(stopData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Image URL is required');
    });

    it('should return 400 when image_url is empty string', async () => {
      const stopData = {
        title: 'Test Stop',
        image_url: ''
      };

      const response = await request(app)
        .post(`/api/journeys/${testJourney.id}/stops`)
        .send(stopData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Image URL is required');
    });

    it('should return 404 when journey does not exist', async () => {
      const nonExistentJourneyId = 'clfake1234567890';
      const stopData = {
        title: 'Test Stop',
        image_url: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post(`/api/journeys/${nonExistentJourneyId}/stops`)
        .send(stopData)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Journey not found');
    });

    it('should handle special characters in title and note', async () => {
      const stopData = {
        title: 'Stop with special chars: áéíóú & symbols @#$%',
        note: 'Note with émojis 🎁 and symbols!',
        image_url: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post(`/api/journeys/${testJourney.id}/stops`)
        .send(stopData)
        .expect(201);

      expect(response.body.title).toBe('Stop with special chars: áéíóú & symbols @#$%');
      expect(response.body.note).toBe('Note with émojis 🎁 and symbols!');
    });

    it('should ignore extra fields in request body', async () => {
      const stopData = {
        title: 'Test Stop',
        image_url: 'https://example.com/image.jpg',
        extraField: 'should be ignored',
        anotherField: 123
      };

      const response = await request(app)
        .post(`/api/journeys/${testJourney.id}/stops`)
        .send(stopData)
        .expect(201);

      expect(response.body).toHaveProperty('title', 'Test Stop');
      expect(response.body).not.toHaveProperty('extraField');
      expect(response.body).not.toHaveProperty('anotherField');
    });
  });

  describe('Updated Journey Retrieval with Stops', () => {
    it('should return journey with empty stops array when no stops exist', async () => {
      const response = await request(app)
        .get(`/api/journeys/${testJourney.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testJourney.id);
      expect(response.body).toHaveProperty('title', testJourney.title);
      expect(response.body).toHaveProperty('stops');
      expect(Array.isArray(response.body.stops)).toBe(true);
      expect(response.body.stops).toHaveLength(0);
    });

    it('should return journey with stops ordered correctly', async () => {
      // Create multiple stops
      await prisma.stop.createMany({
        data: [
          {
            title: 'Third Stop',
            image_url: 'https://example.com/image3.jpg',
            external_url: 'https://restaurant.com/book',
            order: 3,
            journeyId: testJourney.id
          },
          {
            title: 'First Stop',
            image_url: 'https://example.com/image1.jpg',
            order: 1,
            journeyId: testJourney.id
          },
          {
            title: 'Second Stop',
            note: 'Second stop note',
            image_url: 'https://example.com/image2.jpg',
            external_url: 'https://hotel.com/reserve',
            order: 2,
            journeyId: testJourney.id
          }
        ]
      });

      const response = await request(app)
        .get(`/api/journeys/${testJourney.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('stops');
      expect(response.body.stops).toHaveLength(3);

      // Check that stops are ordered correctly
      expect(response.body.stops[0]).toHaveProperty('title', 'First Stop');
      expect(response.body.stops[0]).toHaveProperty('order', 1);
      expect(response.body.stops[1]).toHaveProperty('title', 'Second Stop');
      expect(response.body.stops[1]).toHaveProperty('order', 2);
      expect(response.body.stops[2]).toHaveProperty('title', 'Third Stop');
      expect(response.body.stops[2]).toHaveProperty('order', 3);

      // Check that all required fields are present including external_url
      response.body.stops.forEach((stop: { id: string; title: string; note: string | null; image_url: string; external_url: string | null; order: number }) => {
        expect(stop).toHaveProperty('id');
        expect(stop).toHaveProperty('title');
        expect(stop).toHaveProperty('note');
        expect(stop).toHaveProperty('image_url');
        expect(stop).toHaveProperty('external_url');
        expect(stop).toHaveProperty('order');
        expect(typeof stop.id).toBe('string');
        expect(typeof stop.title).toBe('string');
        expect(typeof stop.order).toBe('number');
      });

      // Verify specific external_url values
      expect(response.body.stops[0]).toHaveProperty('external_url', null); // First Stop
      expect(response.body.stops[1]).toHaveProperty('external_url', 'https://hotel.com/reserve'); // Second Stop
      expect(response.body.stops[2]).toHaveProperty('external_url', 'https://restaurant.com/book'); // Third Stop
    });
  });

  describe('Integration: Create Journey, Add Stops, and Retrieve', () => {
    it('should create journey, add multiple stops, and retrieve complete journey', async () => {
      // Create journey
      const journeyData = { title: 'Integration Test Journey' };
      const journeyResponse = await request(app)
        .post('/api/journeys')
        .send(journeyData)
        .expect(201);

      const journeyId = journeyResponse.body.id;

      // Add first stop
      const stop1Data = {
        title: 'First Adventure Stop',
        note: 'Beginning of our journey',
        image_url: 'https://example.com/start.jpg'
      };
      const stop1Response = await request(app)
        .post(`/api/journeys/${journeyId}/stops`)
        .send(stop1Data)
        .expect(201);

      // Add second stop
      const stop2Data = {
        title: 'Second Adventure Stop',
        image_url: 'https://example.com/middle.jpg'
      };
      const stop2Response = await request(app)
        .post(`/api/journeys/${journeyId}/stops`)
        .send(stop2Data)
        .expect(201);

      // Retrieve complete journey
      const getResponse = await request(app)
        .get(`/api/journeys/${journeyId}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty('id', journeyId);
      expect(getResponse.body).toHaveProperty('title', 'Integration Test Journey');
      expect(getResponse.body.stops).toHaveLength(2);

      expect(getResponse.body.stops[0]).toHaveProperty('id', stop1Response.body.id);
      expect(getResponse.body.stops[0]).toHaveProperty('title', 'First Adventure Stop');
      expect(getResponse.body.stops[0]).toHaveProperty('order', 1);

      expect(getResponse.body.stops[1]).toHaveProperty('id', stop2Response.body.id);
      expect(getResponse.body.stops[1]).toHaveProperty('title', 'Second Adventure Stop');
      expect(getResponse.body.stops[1]).toHaveProperty('order', 2);
    });
  });

  describe('Content-Type and Error Handling', () => {
    it('should return JSON content type for stop creation', async () => {
      const stopData = {
        title: 'Content Type Test',
        image_url: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post(`/api/journeys/${testJourney.id}/stops`)
        .send(stopData)
        .expect(201);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle database errors gracefully', async () => {
      // Test with an extremely long title that might cause database issues
      const stopData = {
        title: 'A'.repeat(10000),
        image_url: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post(`/api/journeys/${testJourney.id}/stops`)
        .send(stopData);

      // Should either succeed or return 500, but not crash
      expect([201, 404, 500]).toContain(response.status);
    });
  });
});