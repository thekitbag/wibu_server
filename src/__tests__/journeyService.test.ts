import { createPublicJourneySummary } from '../services/journeyService';
import type { JourneyWithStops } from '../services/journeyService';

describe('Journey Service', () => {
  describe('createPublicJourneySummary', () => {
    it('should create a public summary with hero image from first stop', () => {
      const journey: JourneyWithStops = {
        id: 'journey-1',
        title: 'A Romantic Trip to Paris',
        paid: true,
        shareableToken: 'token-123',
        stops: [
          {
            id: 'stop-1',
            title: 'Eiffel Tower at Sunset',
            note: 'This is a private note about our romantic evening',
            image_url: 'https://example.com/eiffel-tower.jpg',
            icon_name: null,
            external_url: 'https://toureiffel.paris',
            order: 1
          },
          {
            id: 'stop-2',
            title: 'Café de Flore Morning',
            note: 'Another private note about breakfast',
            image_url: 'https://example.com/cafe.jpg',
            icon_name: null,
            external_url: 'https://cafedeflore.fr',
            order: 2
          }
        ]
      };

      const result = createPublicJourneySummary(journey);

      expect(result).toEqual({
        journeyTitle: 'A Romantic Trip to Paris',
        heroImageUrl: 'https://example.com/eiffel-tower.jpg',
        highlights: ['Eiffel Tower at Sunset', 'Café de Flore Morning']
      });
    });

    it('should return null hero image when first stop has no image_url', () => {
      const journey: JourneyWithStops = {
        id: 'journey-2',
        title: 'Icon-Based Journey',
        paid: true,
        shareableToken: 'token-456',
        stops: [
          {
            id: 'stop-1',
            title: 'Hotel Check-in',
            note: 'Private hotel details',
            image_url: null,
            icon_name: 'Hotel',
            external_url: 'https://hotel.com',
            order: 1
          },
          {
            id: 'stop-2',
            title: 'Restaurant Dinner',
            note: 'Private reservation details',
            image_url: 'https://example.com/restaurant.jpg',
            icon_name: null,
            external_url: 'https://restaurant.com',
            order: 2
          }
        ]
      };

      const result = createPublicJourneySummary(journey);

      expect(result).toEqual({
        journeyTitle: 'Icon-Based Journey',
        heroImageUrl: null,
        highlights: ['Hotel Check-in', 'Restaurant Dinner']
      });
    });

    it('should handle journey with no stops', () => {
      const journey: JourneyWithStops = {
        id: 'journey-3',
        title: 'Empty Journey',
        paid: true,
        shareableToken: 'token-789',
        stops: []
      };

      const result = createPublicJourneySummary(journey);

      expect(result).toEqual({
        journeyTitle: 'Empty Journey',
        heroImageUrl: null,
        highlights: []
      });
    });

    it('should return stops in correct order even if provided out of order', () => {
      const journey: JourneyWithStops = {
        id: 'journey-4',
        title: 'Out of Order Journey',
        paid: true,
        shareableToken: 'token-abc',
        stops: [
          {
            id: 'stop-3',
            title: 'Third Stop',
            note: 'Private note 3',
            image_url: 'https://example.com/third.jpg',
            icon_name: null,
            external_url: 'https://third.com',
            order: 3
          },
          {
            id: 'stop-1',
            title: 'First Stop',
            note: 'Private note 1',
            image_url: 'https://example.com/first.jpg',
            icon_name: null,
            external_url: 'https://first.com',
            order: 1
          },
          {
            id: 'stop-2',
            title: 'Second Stop',
            note: 'Private note 2',
            image_url: null,
            icon_name: 'Restaurant',
            external_url: 'https://second.com',
            order: 2
          }
        ]
      };

      const result = createPublicJourneySummary(journey);

      expect(result).toEqual({
        journeyTitle: 'Out of Order Journey',
        heroImageUrl: 'https://example.com/first.jpg',
        highlights: ['First Stop', 'Second Stop', 'Third Stop']
      });
    });

    it('should exclude all private data from the output', () => {
      const journey: JourneyWithStops = {
        id: 'journey-5',
        title: 'Privacy Test Journey',
        paid: true,
        shareableToken: 'secret-token',
        stops: [
          {
            id: 'stop-1',
            title: 'Public Stop Title',
            note: 'This is very private and personal information',
            image_url: 'https://example.com/public.jpg',
            icon_name: null,
            external_url: 'https://private-booking-link.com',
            order: 1
          }
        ]
      };

      const result = createPublicJourneySummary(journey);

      // Verify no private data is included
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('paid');
      expect(result).not.toHaveProperty('shareableToken');
      expect(result).not.toHaveProperty('stops');
      expect(result).not.toHaveProperty('note');
      expect(result).not.toHaveProperty('external_url');
      expect(result).not.toHaveProperty('icon_name');

      // Verify only expected properties are present
      expect(Object.keys(result)).toEqual(['journeyTitle', 'heroImageUrl', 'highlights']);

      // Verify no private data in string format
      const resultString = JSON.stringify(result);
      expect(resultString).not.toContain('private');
      expect(resultString).not.toContain('personal');
      expect(resultString).not.toContain('secret-token');
      expect(resultString).not.toContain('private-booking-link');
    });

    it('should handle journey with mixed stop types (images and icons)', () => {
      const journey: JourneyWithStops = {
        id: 'journey-6',
        title: 'Mixed Stop Types',
        paid: true,
        shareableToken: 'token-mixed',
        stops: [
          {
            id: 'stop-1',
            title: 'Image Stop',
            note: 'Private image note',
            image_url: 'https://example.com/hero.jpg',
            icon_name: null,
            external_url: 'https://image-link.com',
            order: 1
          },
          {
            id: 'stop-2',
            title: 'Icon Stop',
            note: 'Private icon note',
            image_url: null,
            icon_name: 'Plane',
            external_url: 'https://icon-link.com',
            order: 2
          },
          {
            id: 'stop-3',
            title: 'Another Image Stop',
            note: 'Another private note',
            image_url: 'https://example.com/another.jpg',
            icon_name: null,
            external_url: 'https://another-link.com',
            order: 3
          }
        ]
      };

      const result = createPublicJourneySummary(journey);

      expect(result).toEqual({
        journeyTitle: 'Mixed Stop Types',
        heroImageUrl: 'https://example.com/hero.jpg', // From first stop only
        highlights: ['Image Stop', 'Icon Stop', 'Another Image Stop']
      });
    });

    it('should handle journey where first stop has empty string image_url', () => {
      const journey: JourneyWithStops = {
        id: 'journey-7',
        title: 'Empty String Image Journey',
        paid: true,
        shareableToken: 'token-empty',
        stops: [
          {
            id: 'stop-1',
            title: 'Empty Image Stop',
            note: 'Private note',
            image_url: '', // Empty string should be treated as no image
            icon_name: null,
            external_url: 'https://example.com',
            order: 1
          }
        ]
      };

      const result = createPublicJourneySummary(journey);

      expect(result).toEqual({
        journeyTitle: 'Empty String Image Journey',
        heroImageUrl: null, // Empty string should result in null
        highlights: ['Empty Image Stop']
      });
    });
  });
});