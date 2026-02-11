import { Router } from 'express';
import { getAllUsers, getUserById } from '../controllers/user.controller.js';

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Get all users with optional filtering
 * @query   department, status, search
 * @access  Public
 */
router.get('/', getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @params  id
 * @access  Public
 */
router.get('/:id', getUserById);

export default router;
