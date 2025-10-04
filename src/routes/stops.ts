import express from 'express';
import { updateStop } from '../controllers/stopController';

const router = express.Router();

router.patch('/:stopId', updateStop);

export default router;