import { Request, Response } from 'express';
/**
 * Creates a Stripe checkout session for a journey payment
 * Validates journey existence and payment status before creating the session
 */
export declare const createCheckoutSession: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
