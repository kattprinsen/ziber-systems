import type { TimeEntry } from '../types/time';
import type { MarginParams, MarginResult } from '../types/margin';

// ---------------------------------------------------------------------------
// Billability — T005
// ---------------------------------------------------------------------------

/** Tidig customer IDs treated as non-billable (internal / overhead time). */
export const INTERNAL_CUSTOMER_IDS: ReadonlySet<string> = new Set(['2']);

/**
 * Returns true when the entry should count toward billable hours.
 * Entries whose customerId matches an internal customer (e.g. Consid AB, id "2")
 * are non-billable.
 */
export function isBillable(entry: TimeEntry): boolean {
  if (!entry.customerId) return true; // no customer = external by default
  return !INTERNAL_CUSTOMER_IDS.has(entry.customerId);
}

// ---------------------------------------------------------------------------
// Working day helpers — T006
// ---------------------------------------------------------------------------

/**
 * Returns the total number of Monday–Friday working days in the given month.
 * @param year  Full year, e.g. 2026
 * @param month 0-based month (0 = January, 11 = December)
 */
export function workingDaysInMonth(year: number, month: number): number {
  let count = 0;
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    const dow = date.getDay();
    if (dow >= 1 && dow <= 5) count++;
    date.setDate(date.getDate() + 1);
  }
  return count;
}

/**
 * Returns the number of Monday–Friday working days that have elapsed from the
 * 1st of the month up to and including `upToDay`.
 * @param year    Full year
 * @param month   0-based month
 * @param upToDay 1-based day-of-month (e.g. pass `new Date().getDate()` for today)
 */
export function workingDaysElapsed(
  year: number,
  month: number,
  upToDay: number,
): number {
  let count = 0;
  const last = Math.min(upToDay, daysInMonth(year, month));
  for (let d = 1; d <= last; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow >= 1 && dow <= 5) count++;
  }
  return count;
}

/** Helper: total calendar days in a given month. */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// ---------------------------------------------------------------------------
// Formatting — T007
// ---------------------------------------------------------------------------

const sekFormatter = new Intl.NumberFormat('en-150', {
  style: 'currency',
  currency: 'SEK',
  currencyDisplay: 'code',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Formats a SEK amount using international format with comma thousands
 * separator and ISO code suffix.  e.g. 75000 → "75,000 SEK"
 */
export function formatSEK(amount: number): string {
  return sekFormatter.format(amount);
}

/**
 * Formats a percentage to one decimal place.
 * Returns "N/A" when value is null (i.e. when revenue is zero).
 * e.g. 24.5678 → "24.6%"
 */
export function formatPercent(value: number | null): string {
  if (value === null) return 'N/A';
  return `${value.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Core calculation — T008 (includes T021 clamping for past months)
// ---------------------------------------------------------------------------

/**
 * Calculates the full margin contribution for a user in a given calendar month.
 *
 * Revenue = billable_hours × hourly_rate
 * Cost    = currentSalary + sum(additionalCosts)
 * Margin  = Revenue − Cost
 * Margin% = (Margin / Revenue) × 100  — null when Revenue is 0
 *
 * Working days passed is clamped to workingDaysInMonth for fully completed
 * (past) months so historical views always show 100% day completion.
 */
export function calculateMargin(params: MarginParams): MarginResult {
  const { month, hourlyRate, currentSalary, additionalCosts = [], entries } = params;

  const hasHourlyRate = typeof hourlyRate === 'number' && hourlyRate > 0;
  const effectiveRate = hasHourlyRate ? (hourlyRate as number) : 0;

  // Parse month
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1; // 0-based

  // Determine working days
  const totalWorkingDays = workingDaysInMonth(year, monthIndex);

  // Determine if the selected month is fully in the past
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();
  const isPastMonth =
    year < currentYear || (year === currentYear && monthIndex < currentMonthIndex);

  let passedWorkingDays: number;
  if (isPastMonth) {
    // Clamp to full month — T021
    passedWorkingDays = totalWorkingDays;
  } else {
    // Current month: count up to today
    passedWorkingDays = workingDaysElapsed(year, monthIndex, now.getDate());
  }

  // Billable hours
  const billableHours = entries
    .filter(isBillable)
    .reduce((sum, e) => sum + e.hours, 0);

  // Revenue
  const revenue = billableHours * effectiveRate;

  // Cost: base salary + any additional cost items
  const baseSalary = typeof currentSalary === 'number' ? currentSalary : 0;
  const extraCosts = additionalCosts.reduce((sum, item) => sum + item.amount, 0);
  const salaryCost = baseSalary + extraCosts;

  // Margin
  const margin = revenue - salaryCost;
  const marginPercentage = revenue === 0 ? null : (margin / revenue) * 100;

  return {
    month,
    billableHours,
    revenue,
    salaryCost,
    margin,
    marginPercentage,
    workingDaysInMonth: totalWorkingDays,
    workingDaysPassed: passedWorkingDays,
    hourlyRate: hasHourlyRate ? (hourlyRate as number) : null,
    hasHourlyRate,
  };
}
