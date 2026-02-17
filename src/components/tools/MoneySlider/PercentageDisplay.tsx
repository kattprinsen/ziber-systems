import { formatPercentage, formatCurrency } from '../../../utils/formatters';

interface PercentageDisplayProps {
  percentageChange: number;
  currentSalary: number | null;
  increaseAmount: number | null;
  newSalary?: number | null;
  className?: string;
  mode?: 'amount' | 'percentage';
}

export function PercentageDisplay({
  percentageChange,
  currentSalary,
  increaseAmount,
  newSalary = null,
  className = '',
  mode = 'amount'
}: PercentageDisplayProps) {
  // If current salary is 0, show N/A
  if (currentSalary === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <span className="text-4xl text-gray-500">N/A</span>
        <p className="text-sm text-gray-400 mt-2">Cannot calculate percentage with zero current salary</p>
      </div>
    );
  }

  // If no increase amount entered yet
  if (increaseAmount === null || increaseAmount === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <span className="text-4xl text-gray-500">—</span>
        <p className="text-sm text-gray-400 mt-2">
          {mode === 'percentage' 
            ? 'Enter a percentage to calculate new salary'
            : 'Enter an increase amount to calculate percentage'}
        </p>
      </div>
    );
  }
  
  const isIncrease = percentageChange > 0;
  const isDecrease = percentageChange < 0;
  
  // Use provided newSalary or calculate from increaseAmount
  const calculatedNewSalary = newSalary ?? (currentSalary !== null && increaseAmount !== null ? currentSalary + increaseAmount : null);
  
  const colorClass = isIncrease 
    ? 'text-orange-500' 
    : isDecrease 
    ? 'text-red-500' 
    : 'text-gray-400';
  
  const label = isIncrease 
    ? 'Increase' 
    : isDecrease 
    ? 'Decrease' 
    : 'No Change';
  
  return (
    <div className={`text-center py-6 ${className}`} role="status" aria-live="polite">
      <div className={`text-5xl font-bold ${colorClass} transition-colors duration-300`}>
        {mode === 'percentage' ? `${increaseAmount.toFixed(2)}%` : formatPercentage(percentageChange)}
      </div>
      <p className="text-sm text-gray-400 mt-2">
        {label}
      </p>
      {calculatedNewSalary !== null && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400 mb-1">New Salary</p>
          <p className="text-2xl font-semibold text-white">
            {formatCurrency(calculatedNewSalary)}
          </p>
          {mode === 'percentage' && (
            <p className="text-sm text-gray-400 mt-2">
              Increase: {formatCurrency(calculatedNewSalary - (currentSalary || 0))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
