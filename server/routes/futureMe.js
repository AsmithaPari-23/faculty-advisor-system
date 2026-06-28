import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { simulateFutureMe } from '../controllers/futureMeController.js';

const router = express.Router();

router.use(protect);

router.post('/simulate', authorize('student'), simulateFutureMe);

export default router;
