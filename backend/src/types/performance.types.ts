/**
 * Performance Dashboard Types
 *
 * Types for the group performance dashboard feature (007-group-performance-dashboard).
 * Designed to be extensible: revenue and marginContribution fields are optional
 * so future snapshots can include richer data without breaking existing records.
 */

// ============================================================================
// Performance Config (stored in backend/src/data/performance-config.json)
// ============================================================================

export interface PerformanceConfig {
  /** Monthly billed-hours target for the group. null = not yet configured. */
  target: number | null;
  /** ISO 8601 timestamp of last update. null = never configured. */
  updatedAt: string | null;
}

// ============================================================================
// Monthly Snapshot (stored in backend/src/data/snapshots/YYYY-MM.json)
// ============================================================================

export interface ConsultantMonthlyEntry {
  /** References User.id */
  consultantId: string;
  /** Denormalized display name (captured at snapshot time) */
  consultantName: string;
  /** Total billed hours for this consultant in the month (primary v1 metric) */
  billedHours: number;
  /** Completeness of the data for this entry */
  dataStatus: 'complete' | 'partial' | 'missing';
  /** ISO 8601 timestamp of when this entry was last captured */
  capturedAt: string;
  // Future extensibility — no schema migration required when these are added:
  /** Gross revenue in SEK. Not populated in v1. */
  revenue?: number;
  /** Revenue minus direct costs in SEK. Not populated in v1. */
  marginContribution?: number;
}

export interface MonthlySnapshot {
  year: number;
  month: number;
  /** Sum of billedHours across all consultant entries */
  totalBilledHours: number;
  /** true if any consultant entry has dataStatus 'partial' or 'missing' */
  isPartial: boolean;
  /** ISO 8601 timestamp of when this snapshot was last written */
  snapshotCapturedAt: string;
  consultantEntries: ConsultantMonthlyEntry[];
}

// ============================================================================
// API Response Shapes
// ============================================================================

export interface SnapshotListData {
  available: string[]; // YYYY-MM strings, sorted descending
}
