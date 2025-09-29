import express from 'express';
import { createJourney, getJourneyById } from '../controllers/journeyController';
import { createStop } from '../controllers/stopController';
import { createCheckoutSession } from '../controllers/paymentController';

const router = express.Router();

router.post('/', createJourney);
router.get('/:id', getJourneyById);
router.post('/:journeyId/stops', createStop);
router.post('/:journeyId/create-checkout-session', createCheckoutSession);

export default router;