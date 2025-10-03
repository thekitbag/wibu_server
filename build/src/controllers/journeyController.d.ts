import { Request, Response } from 'express';
/**
 * Creates a new journey with the provided title
 * A journey serves as a container for multiple stops that tell a story
 */
export declare const createJourney: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Retrieves a journey by ID with all associated stops
 * Conditionally includes shareable token if journey is paid
 */
export declare const getJourneyById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Reveals a journey using a secure shareable token
 * Only works for paid journeys - provides secure access to paid content
 */
export declare const revealJourneyByToken: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
