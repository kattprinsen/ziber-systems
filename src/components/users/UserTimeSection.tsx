import { useEffect, useState } from 'react';
import type { TimeEntry, TimeFilter } from '../../types/time';
import timeService from '../../services/timeService';
import { UserTimeEntries } from './UserTimeEntries';
import { UserTimeSummary } from './UserTimeSummary';

interface UserTimeSectionProps {
  userId: string;
}

export function UserTimeSection({ userId }: UserTimeSectionProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [filters, setFilters] = useState<TimeFilter>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);

    const toDate = to.toISOString().slice(0, 10);
    const fromDate = from.toISOString().slice(0, 10);

    return { fromDate, toDate };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTimeEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await timeService.getUserTimeEntries(userId, filters);
      setEntries(data);
    } catch (err) {
      console.error('Failed to fetch time entries:', err);
      setError('Failed to load Tidig time. Please try again.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTimeEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleDateChange = (key: 'fromDate' | 'toDate', value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

   const handleFilterChange = (
    key: 'customerName' | 'projectName',
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const handleApply = () => {
    void loadTimeEntries();
  };

  const handleClearFilters = () => {
    setFilters((prev) => ({ fromDate: prev.fromDate, toDate: prev.toDate }));
    void loadTimeEntries();
  };

  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg p-6 mt-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold text-text-primary">Tidig Time</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-2 text-text-secondary">
            <span>From</span>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => handleDateChange('fromDate', e.target.value)}
              className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-text-primary text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-text-secondary">
            <span>To</span>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => handleDateChange('toDate', e.target.value)}
              className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-text-primary text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-text-secondary">
            <span>Customer</span>
            <input
              type="text"
              value={filters.customerName ?? ''}
              onChange={(e) => handleFilterChange('customerName', e.target.value)}
              placeholder="Name contains..."
              className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-text-primary text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-text-secondary">
            <span>Project</span>
            <input
              type="text"
              value={filters.projectName ?? ''}
              onChange={(e) => handleFilterChange('projectName', e.target.value)}
              placeholder="Name contains..."
              className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-text-primary text-sm"
            />
          </label>
          <button
            type="button"
            onClick={handleApply}
            className="ml-2 px-3 py-1 rounded bg-orange-accent text-black text-sm hover:bg-orange-accent/90 transition-colors"
          >
            Apply
          </button>
          {(filters.customerName || filters.projectName) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3 py-1 rounded border border-dark-border text-text-secondary text-sm hover:border-orange-accent hover:text-orange-accent transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {loading && (
        <p className="text-sm text-text-secondary">Loading time entries...</p>
      )}

      {!loading && error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {!loading && !error && (
        <>
          <UserTimeEntries entries={entries} />
          <UserTimeSummary entries={entries} />
        </>
      )}
    </div>
  );
}
