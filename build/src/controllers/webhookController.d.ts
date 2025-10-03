import { Request, Response } from 'express';
/**
 * Handles incoming Stripe webhook events
 * Processes payment completion events and updates journey payment status
 */
export declare const handleStripeWebhook: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
