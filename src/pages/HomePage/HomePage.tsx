import { useState, useEffect, useCallback } from 'react';
import {
  GroupPerformanceChart,
  MonthNavigator,
  ConsultantBreakdown,
  TargetEditor,
} from '../../components/dashboard';
import {
  fetchSnapshot,
  fetchConfig,
  updateConfig,
} from '../../services/performanceService';
import type {
  MonthlySnapshot,
  PerformanceConfig,
  ChartDataPoint,
} from '../../types/performance';
import { fetchSbqLeafEmployees } from '../../services/syncService';
import type { ExternalEmployeeNode } from '../../types/sync';
import userService from '../../services/userService';
import type { User } from '../../types/user';

// ============================================================================
// Constants
// ============================================================================

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WINDOW_SIZE = 6;

// ============================================================================
// Rolling-window helpers
// ============================================================================

interface WindowMonth {
  year: number;
  month: number; // 1-based
  key: string;   // YYYY-MM
  label: string; // e.g. "Jan"
}

function buildWindow(anchorYear: number, anchorMonth: number): WindowMonth[] {
  const result: WindowMonth[] = [];
  for (let offset = WINDOW_SIZE - 1; offset >= 0; offset--) {
    let y = anchorYear;
    let m = anchorMonth - offset;
    while (m < 1) {
      m += 12;
      y -= 1;
    }
    result.push({
      year: y,
      month: m,
      key: `${y}-${String(m).padStart(2, '0')}`,
      label: MONTH_NAMES_SHORT[m - 1],
    });
  }
  return result;
}

function prevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

function nextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 12) return { year: year + 1, month: 1 };
  return { year, month: month + 1 };
}

function snapshotToChartPoint(
  wm: WindowMonth,
  snapshot: MonthlySnapshot | null
): ChartDataPoint {
  if (!snapshot) {
    return { month: wm.label, hours: 0, isPartial: false, key: wm.key };
  }
  return {
    month: wm.label,
    hours: snapshot.totalBilledHours,
    isPartial: snapshot.isPartial,
    key: wm.key,
  };
}

// ============================================================================
// Homepage
// ============================================================================

export function HomePage() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  // Snapshot cache: key → MonthlySnapshot | null (null = fetch failed / no data)
  const [snapshotCache, setSnapshotCache] = useState<Map<string, MonthlySnapshot | null>>(
    new Map()
  );
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [config, setConfig] = useState<PerformanceConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sbqEmployees, setSbqEmployees] = useState<ExternalEmployeeNode[] | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);

  // ── Config fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    setConfigLoading(true);
    fetchConfig()
      .then((cfg) => { if (active) setConfig(cfg); })
      .catch(() => { /* non-fatal — chart renders without target */ })
      .finally(() => { if (active) setConfigLoading(false); });
    return () => { active = false; };
  }, []);

  // ── SBQ employee subtree fetch ───────────────────────────────────────────
  useEffect(() => {
    let active = true;

    fetchSbqLeafEmployees()
      .then((employees) => {
        if (active) setSbqEmployees(employees);
      })
      .catch(() => {
        // Non-fatal: if subtree fetch fails, fall back to existing behavior
        if (active) setSbqEmployees(null);
      });

    return () => {
      active = false;
    };
  }, []);

  // ── Internal users fetch (for monthlyHours + rates) ─────────────────────
  useEffect(() => {
    let active = true;

    userService
      .getAllUsers()
      .then((u) => {
        if (active) setUsers(u);
      })
      .catch(() => {
        if (active) setUsers(null);
      });

    return () => {
      active = false;
    };
  }, []);

  // ── Window snapshot fetching ──────────────────────────────────────────────
  const fetchWindowSnapshots = useCallback(
    async (anchorYear: number, anchorMonth: number) => {
      const window = buildWindow(anchorYear, anchorMonth);
      const missingKeys = window.filter(
        (wm) => !snapshotCache.has(wm.key) && !loadingKeys.has(wm.key)
      );

      if (missingKeys.length === 0) return;

      setLoadingKeys((prev) => {
        const next = new Set(prev);
        missingKeys.forEach((wm) => next.add(wm.key));
        return next;
      });

      setFetchError(null);

      const results = await Promise.allSettled(
        missingKeys.map((wm) => fetchSnapshot(wm.year, wm.month))
      );

      const updates = new Map<string, MonthlySnapshot | null>();
      results.forEach((result, i) => {
        const key = missingKeys[i].key;
        if (result.status === 'fulfilled') {
          updates.set(key, result.value);
        } else {
          updates.set(key, null);
          // Show error only for the selected month
          if (key === `${anchorYear}-${String(anchorMonth).padStart(2, '0')}`) {
            const msg = result.reason instanceof Error
              ? result.reason.message
              : 'Failed to load performance data';
            setFetchError(msg);
          }
        }
      });

      setSnapshotCache((prev) => {
        const next = new Map(prev);
        updates.forEach((val, key) => next.set(key, val));
        return next;
      });
      setLoadingKeys((prev) => {
        const next = new Set(prev);
        missingKeys.forEach((wm) => next.delete(wm.key));
        return next;
      });
    },
    [snapshotCache, loadingKeys]
  );

  useEffect(() => {
    fetchWindowSnapshots(selectedYear, selectedMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth]);

  // ── Navigation ────────────────────────────────────────────────────────────
  function handlePrev() {
    const { year, month } = prevMonth(selectedYear, selectedMonth);
    setSelectedYear(year);
    setSelectedMonth(month);
  }

  function handleNext() {
    const now = new Date();
    const isAtCurrent =
      selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;
    if (isAtCurrent) return;
    const { year, month } = nextMonth(selectedYear, selectedMonth);
    setSelectedYear(year);
    setSelectedMonth(month);
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const windowMonths = buildWindow(selectedYear, selectedMonth);
  const selectedKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const isWindowLoading = windowMonths.some((wm) => loadingKeys.has(wm.key));

  const sbqEmployeeNames = new Set(
    (sbqEmployees ?? []).map((e) => e.name)
  );

  const sbqEmployeeIds = new Set(
    (sbqEmployees ?? []).map((e) => e.id)
  );

  function getGroupTotalsForMonth(monthKey: string, snapshot: MonthlySnapshot | null) {
    if (users && sbqEmployeeIds.size > 0) {
      let hours = 0;
      let sek = 0;

      for (const user of users) {
        if (!user.employeeID || !sbqEmployeeIds.has(user.employeeID)) continue;

        const monthHours = user.monthlyHours?.[monthKey] ?? 0;
        if (monthHours <= 0) continue;

        hours += monthHours;

        if (typeof user.hourlyRate === 'number' && user.hourlyRate > 0) {
          sek += monthHours * user.hourlyRate;
        }
      }

      if (hours > 0) {
        return { hours, sek: sek > 0 ? sek : undefined };
      }
      // Fall through to snapshot-based totals if all monthlyHours are zero
    }

    if (snapshot) {
      if (sbqEmployeeNames.size === 0) {
        return { hours: snapshot.totalBilledHours, sek: undefined };
      }

      const filteredEntries = snapshot.consultantEntries.filter((entry) =>
        sbqEmployeeNames.has(entry.consultantName)
      );

      const hoursFromSnapshot = filteredEntries.reduce(
        (sum, entry) => sum + entry.billedHours,
        0
      );

      return { hours: hoursFromSnapshot, sek: undefined };
    }

    return { hours: 0, sek: undefined as number | undefined };
  }

  const chartData: ChartDataPoint[] = windowMonths.map((wm) => {
    const snapshot = snapshotCache.get(wm.key) ?? null;
    const monthKey = wm.key;
    const { hours, sek } = getGroupTotalsForMonth(monthKey, snapshot);

    if (!snapshot) {
      return { month: wm.label, hours, sek, isPartial: false, key: wm.key };
    }
    return {
      month: wm.label,
      hours,
      sek,
      isPartial: snapshot.isPartial,
      key: wm.key,
    };
  });

  const selectedSnapshot = snapshotCache.get(selectedKey) ?? null;
  const baseEntries = selectedSnapshot?.consultantEntries ?? [];
  const consultantEntries = sbqEmployeeNames.size === 0
    ? baseEntries
    : baseEntries.filter((entry) => sbqEmployeeNames.has(entry.consultantName));

  const allMissing =
    consultantEntries.length > 0 &&
    consultantEntries.every((e) => e.dataStatus === 'missing');
  const noEntries = consultantEntries.length === 0 && !isWindowLoading;

  // ── Target update ─────────────────────────────────────────────────────────
  async function handleTargetChange(newTarget: number | null) {
    const updated = await updateConfig(newTarget);
    setConfig(updated);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white">Group Performance</h1>
          {!configLoading && (
            <TargetEditor
              target={config?.target ?? null}
              onTargetChange={handleTargetChange}
            />
          )}
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <MonthNavigator
            year={selectedYear}
            month={selectedMonth}
            onPrev={handlePrev}
            onNext={handleNext}
          />
          {isWindowLoading && (
            <span className="text-xs text-gray-500 animate-pulse">Loading…</span>
          )}
        </div>

        {/* Chart card */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          {fetchError && (
            <p className="text-sm text-red-400 mb-4">⚠ {fetchError}</p>
          )}
          {(noEntries || allMissing) && !isWindowLoading ? (
            <div className="flex items-center justify-center h-48 text-gray-500 text-sm italic">
              No data available for this month.
            </div>
          ) : (
            <GroupPerformanceChart
              data={chartData}
              target={config?.target ?? null}
              selectedKey={selectedKey}
              onBarClick={(key) => {
                const [y, m] = key.split('-').map(Number);
                setSelectedYear(y);
                setSelectedMonth(m);
              }}
              isLoading={isWindowLoading && chartData.every((d) => d.hours === 0)}
            />
          )}
        </div>

        {/* Consultant breakdown */}
        {!noEntries && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Consultant Breakdown
            </h2>
            <ConsultantBreakdown
              entries={consultantEntries}
              isLoading={isWindowLoading && consultantEntries.length === 0}
            />
          </div>
        )}
      </div>
    </div>
  );
}
