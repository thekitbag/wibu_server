import express from 'express';
import { revealJourneyByToken } from '../controllers/journeyController';

const router = express.Router();

/**
 * Public reveal endpoint for paid journeys
 * Uses secure shareable token for access control
 */
router.get('/:shareableToken', revealJourneyByToken);

export default router;