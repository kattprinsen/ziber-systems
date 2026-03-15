import { Router } from 'express';
import {
  getConfig,
  updateConfig,
  getSnapshotForMonth,
  listAvailableSnapshots,
} from '../controllers/performance.controller.js';

const router = Router();

// Performance config
router.get('/config', getConfig);
router.put('/config', updateConfig);

// Snapshots
router.get('/snapshots', listAvailableSnapshots);
router.get('/snapshots/:year/:month', getSnapshotForMonth);

export default router;
