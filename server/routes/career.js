import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getCareerDNA } from '../controllers/careerController.js';

const router = express.Router();

router.use(protect);

router.get('/:studentId?', getCareerDNA);

export default router;
