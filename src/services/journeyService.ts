/**
 * Journey Service
 * Contains business logic for journey operations and data transformations
 */

export interface PublicJourneySummary {
  journeyTitle: string;
  heroImageUrl: string | null;
  highlights: string[];
}

export interface JourneyWithStops {
  id: string;
  title: string;
  paid: boolean;
  shareableToken: string | null;
  stops: Array<{
    id: string;
    title: string;
    note: string | null;
    image_url: string | null;
    icon_name: string | null;
    external_url: string | null;
    order: number;
  }>;
}

/**
 * Creates a public-safe version of a Journey that removes all private details
 * @param journey - Full Journey object including related Stops
 * @returns Public-safe journey summary with only safe data
 */
export function createPublicJourneySummary(journey: JourneyWithStops): PublicJourneySummary {
  // Get the first stop (order: 1) for hero image
  const firstStop = journey.stops.find(stop => stop.order === 1);
  const heroImageUrl = (firstStop?.image_url && firstStop.image_url.trim() !== '') ? firstStop.image_url : null;

  // Extract only the titles from stops, in order
  const highlights = journey.stops
    .sort((a, b) => a.order - b.order)
    .map(stop => stop.title);

  return {
    journeyTitle: journey.title,
    heroImageUrl,
    highlights
  };
}