/**
 * Frontend types for the Group Performance Dashboard (feature 007).
 * Mirrors backend/src/types/performance.types.ts — keep in sync.
 */

// ============================================================================
// API response shapes
// ============================================================================

export interface PerformanceConfig {
  target: number | null;
  updatedAt: string | null;
}

export interface ConsultantMonthlyEntry {
  consultantId: string;
  consultantName: string;
  billedHours: number;
  dataStatus: 'complete' | 'partial' | 'missing';
  capturedAt: string;
  revenue?: number;
  marginContribution?: number;
}

export interface MonthlySnapshot {
  year: number;
  month: number;
  totalBilledHours: number;
  isPartial: boolean;
  snapshotCapturedAt: string;
  consultantEntries: ConsultantMonthlyEntry[];
}

export interface SnapshotListData {
  /** YYYY-MM strings, sorted descending */
  available: string[];
}

// ============================================================================
// Chart-specific shapes
// ============================================================================

/** One bar in the GroupPerformanceChart */
export interface ChartDataPoint {
  /** Short label, e.g. "Jan", "Feb" */
  month: string;
  /** Total billed hours for that month (0 if no snapshot) */
  hours: number;
  /** Whether the snapshot is partial/estimated */
  isPartial: boolean;
  /** Original YYYY-MM key — used to correlate with selectedMonth */
  key: string;
}
