import express from 'express';
import { createJourney, getJourneyById } from '../controllers/journeyController';

const router = express.Router();

router.post('/', createJourney);
router.get('/:id', getJourneyById);

export default router;