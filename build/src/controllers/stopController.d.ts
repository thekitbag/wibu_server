import { Request, Response } from 'express';
/**
 * Creates a new stop for a journey
 * Validates required fields and automatically assigns the next order position
 */
export declare const createStop: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
