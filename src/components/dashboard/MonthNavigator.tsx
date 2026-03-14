const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface MonthNavigatorProps {
  year: number;
  month: number; // 1-based
  onPrev: () => void;
  onNext: () => void;
}

export function MonthNavigator({ year, month, onPrev, onNext }: MonthNavigatorProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-based

  const isAtCurrentMonth = year === currentYear && month === currentMonth;
  const label = `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <div className="flex items-center gap-3 select-none">
      <button
        onClick={onPrev}
        className="p-1.5 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-200"
        aria-label="Previous month"
      >
        {/* Chevron left */}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <span className="text-sm font-medium text-gray-200 min-w-[120px] text-center">
        {label}
      </span>

      <button
        onClick={onNext}
        disabled={isAtCurrentMonth}
        className={`p-1.5 rounded transition-colors ${
          isAtCurrentMonth
            ? 'text-gray-600 cursor-not-allowed'
            : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
        }`}
        aria-label="Next month"
        aria-disabled={isAtCurrentMonth}
      >
        {/* Chevron right */}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
