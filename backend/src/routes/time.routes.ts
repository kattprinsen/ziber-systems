import { Router } from 'express';
import { getUserTimeEntries } from '../controllers/time.controller.js';

const router = Router();

/**
 * @route   GET /api/users/:userId/time
 * @desc    Get Tidig time entries for a user and interval
 * @query   fromDate, toDate, customerId, customerName, projectId, projectName
 * @access  Public (relies on Tidig permissions)
 */
router.get('/users/:userId/time', getUserTimeEntries);

export default router;
