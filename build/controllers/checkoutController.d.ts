import { Request, Response } from 'express';
/**
 * Checks the status of a Stripe checkout session and returns journey data if payment is complete
 * Solves race condition between user redirect and webhook processing
 */
export declare const checkCheckoutSessionStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
