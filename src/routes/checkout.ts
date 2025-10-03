import express from 'express';
import { checkCheckoutSessionStatus } from '../controllers/checkoutController';

const router = express.Router();

/**
 * Checkout session status endpoint
 * Allows frontend to poll for payment completion status
 */
router.get('/:sessionId', checkCheckoutSessionStatus);

export default router;