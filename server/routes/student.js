import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getStudentProfile,
  getStudentAttendance,
  getStudentMarks,
  getFullAcademicData,
  requestMeeting,
  getStudentMeetings
} from '../controllers/studentController.js';

const router = express.Router();

// All student routes require logging in
router.use(protect);

router.get('/profile', getStudentProfile);
router.get('/attendance', getStudentAttendance);
router.get('/marks', getStudentMarks);
router.get('/academic', getFullAcademicData);

// Meeting requests
router.post('/meeting', authorize('student'), requestMeeting);
router.get('/meetings', authorize('student'), getStudentMeetings);

export default router;
