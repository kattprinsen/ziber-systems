import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import type { ApiResponse } from '../types/user.types.js';
import type {
  PerformanceConfig,
  MonthlySnapshot,
  ConsultantMonthlyEntry,
  SnapshotListData,
} from '../types/performance.types.js';
import {
  readConfig,
  writeConfig,
  readSnapshot,
  writeSnapshot,
  listSnapshots,
} from '../services/performance.service.js';
import userService from '../services/user.service.js';
import { fetchTimeEntries } from '../services/tidigTime.service.js';

// ============================================================================
// Zod Schemas
// ============================================================================

const UpdateConfigSchema = z.object({
  target: z.number().positive('Target must be a positive number').nullable(),
});

// ============================================================================
// Helpers
// ============================================================================

function parseYearMonth(
  yearStr: string,
  monthStr: string
): { year: number; month: number } | null {
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
  if (year < 2000 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  return { year, month };
}

function firstDayOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function lastDayOfMonth(year: number, month: number): string {
  const date = new Date(year, month, 0); // day=0 → last day of previous month
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ============================================================================
// GET /api/performance/config
// ============================================================================

export const getConfig = asyncHandler(
  async (_req: Request, res: Response<ApiResponse<PerformanceConfig>>) => {
    const config = await readConfig();
    res.json({ success: true, data: config });
  }
);

// ============================================================================
// PUT /api/performance/config
// ============================================================================

export const updateConfig = asyncHandler(
  async (req: Request, res: Response<ApiResponse<PerformanceConfig>>) => {
    const parseResult = UpdateConfigSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid config body',
        details: parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      });
      return;
    }

    const updated: PerformanceConfig = {
      target: parseResult.data.target,
      updatedAt: new Date().toISOString(),
    };
    await writeConfig(updated);
    res.json({ success: true, data: updated, message: 'Performance target updated' });
  }
);

// ============================================================================
// GET /api/performance/snapshots/:year/:month
// ============================================================================

export const getSnapshotForMonth = asyncHandler(
  async (req: Request, res: Response<ApiResponse<MonthlySnapshot>>) => {
    const parsed = parseYearMonth(req.params.year, req.params.month);
    if (!parsed) {
      res.status(400).json({ success: false, error: 'Invalid year or month parameters' });
      return;
    }
    const { year, month } = parsed;

    // Try live fetch from Tidig
    try {
      const users = await userService.getAllUsers();
      const activeUsers = users.filter((u) => u.status === 'active' && u.employeeID);

      const fromDate = firstDayOfMonth(year, month);
      const toDate = lastDayOfMonth(year, month);
      const capturedAt = new Date().toISOString();

      const entries: ConsultantMonthlyEntry[] = await Promise.all(
        activeUsers.map(async (user) => {
          const result = await fetchTimeEntries({
            empId: user.employeeID!,
            fromDate,
            toDate,
          });

          const billedHours = result.success
            ? result.entries.reduce((sum, e) => sum + (e.hours ?? 0), 0)
            : 0;

          return {
            consultantId: user.id,
            consultantName: user.name,
            billedHours,
            dataStatus: result.success ? ('complete' as const) : ('missing' as const),
            capturedAt,
          };
        })
      );

      const totalBilledHours = entries.reduce((sum, e) => sum + e.billedHours, 0);
      const isPartial = entries.some(
        (e) => e.dataStatus === 'partial' || e.dataStatus === 'missing'
      );

      const snapshot: MonthlySnapshot = {
        year,
        month,
        totalBilledHours,
        isPartial,
        snapshotCapturedAt: capturedAt,
        consultantEntries: entries,
      };

      // Persist for future cache hits
      await writeSnapshot(snapshot);

      res.json({ success: true, data: snapshot });
      return;
    } catch (liveError) {
      console.warn(
        `[Performance] Live Tidig fetch failed for ${year}-${month}, trying cache:`,
        liveError
      );
    }

    // Fall back to cached snapshot
    const cached = await readSnapshot(year, month);
    if (cached) {
      res.json({
        success: true,
        data: cached,
        message: 'Served from cache — live fetch unavailable',
      });
      return;
    }

    // No live data and no cache
    res.status(503).json({
      success: false,
      error: 'Tidig API unavailable and no cached snapshot exists for this month',
    });
  }
);

// ============================================================================
// GET /api/performance/snapshots
// ============================================================================

export const listAvailableSnapshots = asyncHandler(
  async (_req: Request, res: Response<ApiResponse<SnapshotListData>>) => {
    const available = await listSnapshots();
    res.json({ success: true, data: { available } });
  }
);
