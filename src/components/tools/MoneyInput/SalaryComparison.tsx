interface SalaryComparisonProps {
  currentSalary: number | null;
  onCurrentSalaryChange: (value: number) => void;
  proposedSalary: number | null;
  onProposedSalaryChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export function SalaryComparison({
  currentSalary,
  onCurrentSalaryChange,
  proposedSalary,
  onProposedSalaryChange,
  disabled = false,
  className = ''
}: SalaryComparisonProps) {
  const handleCurrentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === '') {
      onCurrentSalaryChange(0);
      return;
    }
    const numValue = Number(newValue);
    if (!isNaN(numValue)) {
      onCurrentSalaryChange(numValue);
    }
  };

  const handleProposedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === '') {
      onProposedSalaryChange(0);
      return;
    }
    const numValue = Number(newValue);
    if (!isNaN(numValue)) {
      onProposedSalaryChange(numValue);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label 
          htmlFor="current-salary-input" 
          className="block text-sm font-medium mb-2 text-gray-200"
        >
          Current Salary
        </label>
        <input
          id="current-salary-input"
          type="number"
          min="0"
          step="1"
          value={currentSalary ?? ''}
          onChange={handleCurrentChange}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded-lg bg-gray-800 text-white border-gray-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
          placeholder="Enter current salary (e.g., 85000)"
          aria-label="Current salary amount"
        />
        <p className="mt-1 text-xs text-gray-500">The employee's current annual salary</p>
      </div>

      <div>
        <label 
          htmlFor="proposed-salary-input" 
          className="block text-sm font-medium mb-2 text-gray-200"
        >
          Proposed New Salary
        </label>
        <input
          id="proposed-salary-input"
          type="number"
          min="0"
          step="1"
          value={proposedSalary ?? ''}
          onChange={handleProposedChange}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded-lg bg-gray-800 text-white border-gray-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
          placeholder="Enter proposed salary (e.g., 90000)"
          aria-label="Proposed salary amount"
        />
        <p className="mt-1 text-xs text-gray-500">The new salary you're considering</p>
      </div>
    </div>
  );
}
