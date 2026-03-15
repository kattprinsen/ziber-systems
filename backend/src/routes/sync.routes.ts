/**
 * Sync Routes (T062)
 * 
 * API endpoints for sync status monitoring and management.
 */

import { Router } from 'express';
import { getSyncStatus, getSyncLogs, getTidigSubtree } from '../controllers/sync.controller.js';

const router = Router();

/**
 * @route   GET /api/sync/status
 * @desc    Get current sync status and last sync log
 * @access  Public
 */
router.get('/status', getSyncStatus);

/**
 * @route   GET /api/sync/logs
 * @desc    Get sync operation logs (T074)
 * @access  Public
 */
router.get('/logs', getSyncLogs);

/**
 * @route   GET /api/sync/subtree
 * @desc    Get Tidig employee subtree for SBQ derivation
 * @access  Public (no sensitive data; structure only)
 */
router.get('/subtree', getTidigSubtree);

export default router;
