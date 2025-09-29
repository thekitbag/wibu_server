import { Request, Response } from 'express';
import { prisma } from '../server';

export const createJourney = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const journey = await prisma.journey.create({
      data: {
        title,
      },
    });

    res.status(201).json({
      id: journey.id,
      title: journey.title,
    });
  } catch (error) {
    console.error('Error creating journey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getJourneyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const journey = await prisma.journey.findUnique({
      where: { id },
      include: {
        stops: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }

    const response: {
      id: string;
      title: string;
      paid: boolean;
      stops: Array<{
        id: string;
        title: string;
        note: string | null;
        image_url: string | null;
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
        order: stop.order
      }))
    };

    // Include shareableToken only if journey is paid
    if (journey.paid && journey.shareableToken) {
      response.shareableToken = journey.shareableToken;
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching journey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};