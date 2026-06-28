import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getStudentSuccessData,
  generateSuccessData,
  getRecommendations
} from '../controllers/successController.js';

const router = express.Router();

router.use(protect);

router.post('/generate', authorize('student'), generateSuccessData);
router.get('/recommendations/:studentId?', getRecommendations);
router.get('/:studentId?', getStudentSuccessData);

export default router;
