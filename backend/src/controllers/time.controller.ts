import { Request, Response } from 'express';
import userService from '../services/user.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import type { ApiResponse } from '../types/user.types.js';
import { fetchTimeEntries } from '../services/tidigTime.service.js';
import type { TimeEntry } from '../models/tidigTime.js';

export const getUserTimeEntries = asyncHandler(
  async (req: Request, res: Response<ApiResponse<TimeEntry[]>>) => {
    const { userId } = req.params;
    const { fromDate, toDate, customerId, customerName, projectId, projectName } = req.query;

    if (typeof fromDate !== 'string' || typeof toDate !== 'string') {
      res.status(400).json({
        success: false,
        error: 'fromDate and toDate query parameters are required',
      });
      return;
    }

    const user = await userService.getUserById(userId);

    if (!user.employeeID) {
      res.status(400).json({
        success: false,
        error: 'User does not have a Tidig employeeID configured',
      });
      return;
    }

    const result = await fetchTimeEntries({
      empId: user.employeeID,
      fromDate,
      toDate,
      customerId: typeof customerId === 'string' ? customerId : undefined,
      customerName: typeof customerName === 'string' ? customerName : undefined,
      projectId: typeof projectId === 'string' ? projectId : undefined,
      projectName: typeof projectName === 'string' ? projectName : undefined,
    });

    if (!result.success) {
      const firstError = result.errors[0];
      const statusCode = firstError?.code === 'SYNC_DATA_INVALID' ? 400 : 502;

      res.status(statusCode).json({
        success: false,
        error: firstError?.message ?? 'Failed to fetch time entries from Tidig',
        details: result.errors.map((err) => err.message),
      });
      return;
    }

    res.json({
      success: true,
      data: result.entries,
      message: `Retrieved ${result.entries.length} time entries`,
    });
  }
);
