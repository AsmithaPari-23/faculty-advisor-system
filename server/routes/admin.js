import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getAdminStats,
  getAdminUsers,
  assignAdvisor,
  deleteUser
} from '../controllers/adminController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.post('/assign-advisor', assignAdvisor);
router.post('/delete-user', deleteUser);

export default router;
