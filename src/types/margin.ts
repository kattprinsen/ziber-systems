import type { TimeEntry } from './time';

/**
 * Computed margin contribution result for a user and calendar month.
 * Never persisted — derived from TimeEntry[] + User fields at render time.
 */
export interface MarginResult {
  /** Calendar month this result covers — format: "YYYY-MM" */
  month: string;

  /** Sum of hours across all billable TimeEntry records in the month */
  billableHours: number;

  /** billableHours × hourlyRate (SEK). 0 if no hourly rate. */
  revenue: number;

  /** Full monthly salary cost (currentSalary + additionalCosts). 0 if not configured. */
  salaryCost: number;

  /** revenue − salaryCost (SEK). May be negative. */
  margin: number;

  /**
   * (margin / revenue) × 100.
   * null when revenue === 0 (displays as "N/A").
   */
  marginPercentage: number | null;

  /** Total Monday–Friday working days in the selected month */
  workingDaysInMonth: number;

  /**
   * Monday–Friday days elapsed from 1st to today.
   * Clamped to workingDaysInMonth for past months.
   */
  workingDaysPassed: number;

  /** Hourly rate used in the calculation. null if not configured. */
  hourlyRate: number | null;

  /** true when hourlyRate is a positive number; false otherwise */
  hasHourlyRate: boolean;
}

/**
 * A single additional cost item beyond base salary.
 * Reserved for future use (e.g. travel, equipment reimbursements).
 * See FR-013.
 */
export interface CostItem {
  /** Human-readable label shown in the cost breakdown UI */
  label: string;
  /** Amount in SEK */
  amount: number;
}

/**
 * Input parameters for the margin calculator.
 */
export interface MarginParams {
  /** YYYY-MM month to calculate */
  month: string;

  /** User's hourly rate (SEK/h). undefined / null → hasHourlyRate = false */
  hourlyRate?: number | null;

  /** User's monthly gross salary (SEK). undefined / null → salaryCost = 0 */
  currentSalary?: number | null;

  /**
   * Additional cost items beyond base salary (FR-013 extensibility hook).
   * Summed into salaryCost. Pass [] or omit when no additional costs apply.
   */
  additionalCosts?: readonly CostItem[];

  /** All time entries fetched from Tidig for the month */
  entries: TimeEntry[];
}
