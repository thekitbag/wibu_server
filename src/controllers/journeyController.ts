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
    });

    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }

    res.status(200).json(journey);
  } catch (error) {
    console.error('Error fetching journey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};