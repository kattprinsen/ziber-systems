import { useCallback, useEffect, useState } from 'react';
import timeService from '../../services/timeService';
import {
  calculateMargin,
  formatSEK,
  formatPercent,
} from '../../services/marginCalculator';
import type { MarginResult } from '../../types/margin';
import type { TimeEntry } from '../../types/time';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MarginContributionPanelProps {
  userId: string;
  /** Tidig employee ID — if absent, renders "not linked" notice instead of fetching */
  employeeID?: string;
  hourlyRate?: number | null;
  currentSalary?: number | null;
}

// ---------------------------------------------------------------------------
// Panel UI state
// ---------------------------------------------------------------------------

type PanelState =
  | 'loading'
  | 'error'
  | 'no-employee-id'
  | 'rate-not-set'
  | 'showing-figures';

// ---------------------------------------------------------------------------
// Month helpers
// ---------------------------------------------------------------------------

function getCurrentYYYYMM(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function decrementMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split('-').map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}

function incrementMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split('-').map(Number);
  if (m === 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

function lastDayOfMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split('-').map(Number);
  const d = new Date(y, m, 0).getDate();
  return `${yyyymm}-${String(d).padStart(2, '0')}`;
}

function formatMonthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Displays margin contribution for a user in a given calendar month.
 *
 * States:
 *   loading        — fetching time entries from Tidig
 *   error          — Tidig API call failed
 *   no-employee-id — user has no Tidig employee ID
 *   rate-not-set   — user has no hourly rate configured
 *   showing-figures — fully rendered calculation table
 *
 * Month navigation (US3):
 *   < decrements month; > increments toward current month (disabled at current).
 */
export function MarginContributionPanel({
  userId,
  employeeID,
  hourlyRate,
  currentSalary,
}: MarginContributionPanelProps) {
  const [month, setMonth] = useState<string>(getCurrentYYYYMM);
  const [panelState, setPanelState] = useState<PanelState>('loading');
  const [result, setResult] = useState<MarginResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentMonth = getCurrentYYYYMM();
  const isAtCurrentMonth = month === currentMonth;

  const fetchAndCalculate = useCallback(async () => {
    // Guard: no employee ID
    if (!employeeID) {
      setPanelState('no-employee-id');
      return;
    }

    // Guard: no hourly rate
    if (!hourlyRate || hourlyRate <= 0) {
      setPanelState('rate-not-set');
      return;
    }

    setPanelState('loading');
    setErrorMessage(null);

    try {
      const fromDate = `${month}-01`;
      const toDate = lastDayOfMonth(month);
      const entries: TimeEntry[] = await timeService.getUserTimeEntries(userId, {
        fromDate,
        toDate,
      });

      const marginResult = calculateMargin({
        month,
        hourlyRate,
        currentSalary,
        entries,
      });

      setResult(marginResult);
      setPanelState('showing-figures');
    } catch (err) {
      console.error('[MarginContributionPanel] Failed to fetch time entries:', err);
      setErrorMessage(
        'Failed to load time data from Tidig. The rest of the page is still available.',
      );
      setPanelState('error');
    }
  }, [userId, employeeID, hourlyRate, currentSalary, month]);

  // Re-fetch whenever month (or user props) changes — T011, T020
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAndCalculate();
  }, [fetchAndCalculate]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg p-6 mt-6">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-text-primary">
          Margin Contribution
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonth((prev) => decrementMonth(prev))}
            className="px-2 py-1 text-lg text-text-secondary hover:text-orange-accent transition-colors focus-orange rounded"
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="text-sm text-text-secondary min-w-[130px] text-center select-none">
            {formatMonthLabel(month)}
          </span>
          <button
            onClick={() => setMonth((prev) => incrementMonth(prev))}
            disabled={isAtCurrentMonth}
            className="px-2 py-1 text-lg text-text-secondary hover:text-orange-accent transition-colors focus-orange rounded disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      {/* ── State: loading ── */}
      {panelState === 'loading' && (
        <div className="flex items-center gap-3 text-text-secondary py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-accent flex-shrink-0" />
          <p className="text-sm">Loading margin data…</p>
        </div>
      )}

      {/* ── State: error ── */}
      {panelState === 'error' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4">
          <p className="text-red-400 text-sm">{errorMessage}</p>
          <button
            onClick={() => void fetchAndCalculate()}
            className="mt-2 text-xs text-orange-accent hover:underline focus-orange"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── State: no-employee-id ── */}
      {panelState === 'no-employee-id' && (
        <div className="bg-gray-500/10 border border-gray-500/30 rounded-md p-4 text-text-secondary text-sm">
          <p>Employee ID not linked — cannot fetch time data from Tidig.</p>
          <p className="mt-1 text-xs">
            Ask an administrator to set the Tidig employee ID for this user.
          </p>
        </div>
      )}

      {/* ── State: rate-not-set ── */}
      {panelState === 'rate-not-set' && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-4 text-yellow-400 text-sm">
          <p>Hourly rate not configured for this user.</p>
          <p className="mt-1 text-xs text-text-secondary">
            Add an{' '}
            <code className="text-orange-accent">hourlyRate</code> value to the
            user record to enable margin calculation.
          </p>
        </div>
      )}

      {/* ── State: showing-figures ── */}
      {panelState === 'showing-figures' && result && (
        <div>
          {/* Working days context */}
          <p className="text-xs text-text-secondary mb-4">
            Working days:{' '}
            <span className="text-text-primary font-medium">
              {result.workingDaysPassed} / {result.workingDaysInMonth}
            </span>{' '}
            passed
          </p>

          {/* No-billable-time sub-state — T013 */}
          {result.billableHours === 0 && (
            <p className="text-sm text-text-secondary italic mb-3">
              No billable time reported yet for this month.
            </p>
          )}

          {/* Figures table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm border-b border-dark-border pb-2">
              <span className="text-text-secondary">Billable hours</span>
              <span className="text-text-primary font-medium tabular-nums">
                {result.billableHours.toFixed(1)} h
              </span>
            </div>

            <div className="flex justify-between items-center text-sm border-b border-dark-border pb-2">
              <span className="text-text-secondary">
                Revenue
                {result.hourlyRate != null && (
                  <span className="ml-1 text-xs opacity-70">
                    ({formatSEK(result.hourlyRate)}/h)
                  </span>
                )}
              </span>
              <span className="text-text-primary font-medium tabular-nums">
                {formatSEK(result.revenue)}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm border-b border-dark-border pb-2">
              <span className="text-text-secondary">Salary cost</span>
              <span className="text-text-primary font-medium tabular-nums">
                {formatSEK(result.salaryCost)}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm pt-1">
              <span className="text-text-primary font-semibold">Margin</span>
              <div className="text-right tabular-nums">
                <span
                  className={`font-bold text-base ${
                    result.margin >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {formatSEK(result.margin)}
                </span>
                <span className="ml-2 text-sm text-text-secondary">
                  ({formatPercent(result.marginPercentage)})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
