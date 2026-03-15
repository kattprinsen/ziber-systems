import type { ConsultantMonthlyEntry } from '../../types/performance';

const STATUS_LABELS: Record<ConsultantMonthlyEntry['dataStatus'], string> = {
  complete: '',
  partial: 'partial',
  missing: 'no data',
};

const STATUS_COLORS: Record<ConsultantMonthlyEntry['dataStatus'], string> = {
  complete: '',
  partial: 'text-violet-400',
  missing: 'text-gray-500',
};

interface ConsultantBreakdownProps {
  entries: ConsultantMonthlyEntry[];
  isLoading?: boolean;
}

function BreakdownSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex justify-between items-center py-2 border-b border-gray-800">
          <div className="h-4 bg-gray-700 rounded w-32" />
          <div className="h-4 bg-gray-700 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

export function ConsultantBreakdown({ entries, isLoading = false }: ConsultantBreakdownProps) {
  if (isLoading) return <BreakdownSkeleton />;

  if (entries.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic py-2">
        No consultant data for this month.
      </p>
    );
  }

  const sorted = [...entries].sort((a, b) => b.billedHours - a.billedHours);

  return (
    <div className="divide-y divide-gray-800">
      {sorted.map((entry) => {
        const isMissing = entry.dataStatus === 'missing';
        const label = STATUS_LABELS[entry.dataStatus];
        const colorClass = STATUS_COLORS[entry.dataStatus];

        return (
          <div
            key={entry.consultantId}
            className="flex items-center justify-between py-2 text-sm"
          >
            <span className="text-gray-300">{entry.consultantName}</span>
            <span className={`font-mono tabular-nums ${colorClass || 'text-gray-100'}`}>
              {isMissing ? (
                <span className="text-gray-500 italic text-xs">No data</span>
              ) : (
                <>
                  {entry.billedHours.toFixed(1)} h
                  {label && (
                    <span className={`ml-1.5 text-xs ${colorClass}`}>({label})</span>
                  )}
                </>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
