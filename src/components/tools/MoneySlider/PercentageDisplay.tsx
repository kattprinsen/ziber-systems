import { formatPercentage, formatCurrency } from '../../../utils/formatters';

interface PercentageDisplayProps {
  percentageChange: number;
  currentSalary: number | null;
  increaseAmount: number | null;
  className?: string;
}

export function PercentageDisplay({
  percentageChange,
  currentSalary,
  increaseAmount,
  className = ''
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
        <p className="text-sm text-gray-400 mt-2">Enter an increase amount to calculate percentage</p>
      </div>
    );
  }
  
  const isIncrease = percentageChange > 0;
  const isDecrease = percentageChange < 0;
  const newSalary = currentSalary !== null && increaseAmount !== null ? currentSalary + increaseAmount : null;
  
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
        {formatPercentage(percentageChange)}
      </div>
      <p className="text-sm text-gray-400 mt-2">
        {label}
      </p>
      {newSalary !== null && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400 mb-1">New Salary</p>
          <p className="text-2xl font-semibold text-white">
            {formatCurrency(newSalary)}
          </p>
        </div>
      )}
    </div>
  );
}
