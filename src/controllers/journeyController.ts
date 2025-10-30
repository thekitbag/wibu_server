import { Request, Response } from 'express';
import { prisma } from '../server';
import { createPublicJourneySummary } from '../services/journeyService';

/**
 * Creates a new journey with the provided title
 * A journey serves as a container for multiple stops that tell a story
 */
export const createJourney = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;

    // Validate required title field
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Create the journey with default unpaid status
    const journey = await prisma.journey.create({
      data: {
        title,
      },
    });

    // Return basic journey information
    res.status(201).json({
      id: journey.id,
      title: journey.title,
    });
  } catch (error) {
    console.error('Error creating journey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Retrieves a journey by ID with all associated stops
 * Conditionally includes shareable token if journey is paid
 */
export const getJourneyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch journey with all stops ordered by position
    const journey = await prisma.journey.findUnique({
      where: { id },
      include: {
        stops: {
          orderBy: {
            order: 'asc' // Ensure stops are returned in correct sequence
          }
        }
      }
    });

    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }

    // Build response object with proper typing
    const response: {
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
    } = {
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
    };

    // Only include shareable token for paid journeys
    // This prevents unauthorized access to unpaid content
    if (journey.paid && journey.shareableToken) {
      response.shareableToken = journey.shareableToken;
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching journey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Reveals a journey using a secure shareable token
 * Only works for paid journeys - provides secure access to paid content
 */
export const revealJourneyByToken = async (req: Request, res: Response) => {
  try {
    const { shareableToken } = req.params;

    // Find journey by shareable token with all associated stops
    const journey = await prisma.journey.findUnique({
      where: { shareableToken },
      include: {
        stops: {
          orderBy: {
            order: 'asc' // Ensure stops are returned in correct sequence
          }
        }
      }
    });

    // Return 404 if journey not found OR if journey is not paid
    // This maintains security by not revealing unpaid content
    if (!journey || !journey.paid) {
      return res.status(404).json({ error: 'Journey not found' });
    }

    // Return full journey data for paid journeys
    const response = {
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
    };

    res.json(response);
  } catch (error) {
    console.error('Error revealing journey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Retrieves public-safe summaries of paid journeys
 * Returns sanitized data without private information for public display
 */
export const getPublicJourneys = async (req: Request, res: Response) => {
  try {
    // Fetch the 10 most recent paid journeys with their stops
    const journeys = await prisma.journey.findMany({
      where: {
        paid: true
      },
      include: {
        stops: {
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        id: 'desc' // Most recent first
      },
      take: 10
    });

    // Transform each journey to public-safe summary
    const publicSummaries = journeys.map(journey => createPublicJourneySummary(journey));

    res.json(publicSummaries);
  } catch (error) {
    console.error('Error fetching public journeys:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Retrieves a public-safe summary of a single journey by ID
 * Returns sanitized data without private information for social sharing
 */
export const getPublicJourneyById = async (req: Request, res: Response) => {
  try {
    const { journeyId } = req.params;

    // Fetch the journey with its stops
    const journey = await prisma.journey.findUnique({
      where: { id: journeyId },
      include: {
        stops: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    // Return 404 if journey not found
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }

    // Transform to public-safe summary
    const publicSummary = createPublicJourneySummary(journey);

    res.json(publicSummary);
  } catch (error) {
    console.error('Error fetching public journey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};