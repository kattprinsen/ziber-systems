import { formatCurrency } from '../../../utils/formatters';

interface SalaryInputProps {
  value: number | null;
  onChange: (value: number) => void;
  currentSalary: number | null;
  disabled?: boolean;
  error?: string;
  className?: string;
  mode?: 'amount' | 'percentage';
}

export function SalaryInput({
  value,
  onChange,
  currentSalary,
  disabled = false,
  error,
  className = '',
  mode = 'amount'
}: SalaryInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === '') {
      onChange(0);
      return;
    }
    const numValue = Number(newValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
  };

  const isPercentageMode = mode === 'percentage';
  const label = isPercentageMode 
    ? 'Percentage Increase' 
    : 'Salary Increase Amount';
  const placeholder = isPercentageMode
    ? 'Enter percentage (e.g., 2.4)'
    : 'Enter increase amount (e.g., 1500)';
  const hint = isPercentageMode
    ? 'Enter the percentage increase for the salary'
    : 'Use arrow keys to adjust values precisely';

  return (
    <div className={`mb-4 ${className}`}>
      {currentSalary !== null && (
        <div className="text-sm text-gray-400 mb-2">
          Current Salary: <span className="font-semibold text-white">
            {formatCurrency(currentSalary)}
          </span>
        </div>
      )}
      
      <label 
        htmlFor="salary-input" 
        className="block text-sm font-medium mb-2 text-gray-200"
      >
        {label}
      </label>
      
      <div className="relative">
        <input
          id="salary-input"
          type="number"
          min="0"
          step={isPercentageMode ? "0.1" : "1"}
          value={value ?? ''}
          onChange={handleChange}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg bg-gray-800 text-white focus:ring-1 focus:ring-orange-500 outline-none transition-colors pr-10 ${
            error ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
          }`}
          placeholder={placeholder}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? 'salary-error' : 'salary-hint'}
        />
        {isPercentageMode && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            %
          </span>
        )}
      </div>
      
      {!error && (
        <p id="salary-hint" className="mt-1 text-xs text-gray-500">
          {hint}
        </p>
      )}
      
      {error && (
        <p id="salary-error" className="mt-1 text-sm text-red-500 flex items-center" role="alert">
          <svg 
            className="w-4 h-4 mr-1 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
