import express from 'express';
import { createStop } from '../controllers/stopController';

const router = express.Router({ mergeParams: true });

router.post('/', createStop);

export default router;