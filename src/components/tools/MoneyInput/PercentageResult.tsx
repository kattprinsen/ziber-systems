import { formatPercentage, formatCurrency } from '../../../utils/formatters';

interface PercentageResultProps {
  percentageChange: number;
  currentSalary: number | null;
  proposedSalary: number | null;
  className?: string;
}

export function PercentageResult({
  percentageChange,
  currentSalary,
  proposedSalary,
  className = ''
}: PercentageResultProps) {
  // If current salary is 0, show N/A
  if (currentSalary === 0 || currentSalary === null) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <span className="text-4xl text-gray-500">—</span>
        <p className="text-sm text-gray-400 mt-2">Enter current salary to begin</p>
      </div>
    );
  }

  // If no proposed salary entered yet
  if (proposedSalary === null || proposedSalary === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <span className="text-4xl text-gray-500">—</span>
        <p className="text-sm text-gray-400 mt-2">Enter proposed salary to calculate percentage</p>
      </div>
    );
  }
  
  const isIncrease = percentageChange > 0;
  const isDecrease = percentageChange < 0;
  const increaseAmount = proposedSalary - currentSalary;
  
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
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-sm text-gray-400 mb-1">Salary Change</p>
        <p className={`text-2xl font-semibold ${colorClass}`}>
          {increaseAmount > 0 ? '+' : ''}{formatCurrency(increaseAmount)}
        </p>
      </div>
    </div>
  );
}
