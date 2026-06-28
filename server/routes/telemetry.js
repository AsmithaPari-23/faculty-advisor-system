import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  simulateTelemetryAction,
  getTelemetryStatus,
  getTelemetryLogs,
  toggleAutoTelemetry,
  getStudentsForSimulation
} from '../controllers/telemetryController.js';

const router = express.Router();

// Allow authenticated users to simulate data for research/demo purposes
router.use(protect);

router.post('/simulate', simulateTelemetryAction);
router.post('/toggle-auto', toggleAutoTelemetry);
router.get('/status', getTelemetryStatus);
router.get('/logs', getTelemetryLogs);
router.get('/students', getStudentsForSimulation);

export default router;
