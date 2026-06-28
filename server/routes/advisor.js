import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getAdvisorStudents,
  getAdvisorMeetings,
  updateMeetingStatus,
  postAdvisorRecommendation
} from '../controllers/advisorController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('faculty'));

router.get('/students', getAdvisorStudents);
router.get('/meetings', getAdvisorMeetings);
router.post('/meetings/:meetingId', updateMeetingStatus);
router.post('/recommendations', postAdvisorRecommendation);

export default router;
