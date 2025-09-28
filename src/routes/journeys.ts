import express from 'express';
import { createJourney, getJourneyById } from '../controllers/journeyController';
import { createStop } from '../controllers/stopController';

const router = express.Router();

router.post('/', createJourney);
router.get('/:id', getJourneyById);
router.post('/:journeyId/stops', createStop);

export default router;