import { useState } from 'react';
import { SalaryComparison } from './SalaryComparison';
import { PercentageResult } from './PercentageResult';
import { calculateSalaryPercentage } from '../../../services/salaryCalculator';

export function MoneyInput() {
  const [currentSalary, setCurrentSalary] = useState<number | null>(null);
  const [proposedSalary, setProposedSalary] = useState<number | null>(null);
  
  // Calculate percentage change in real-time
  const percentageChange = currentSalary !== null && proposedSalary !== null
    ? calculateSalaryPercentage(currentSalary, proposedSalary)
    : 0;

  return (
    <>
      <SalaryComparison
        currentSalary={currentSalary}
        onCurrentSalaryChange={setCurrentSalary}
        proposedSalary={proposedSalary}
        onProposedSalaryChange={setProposedSalary}
      />
      
      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-200 mb-2">Percentage Change</h3>
        <PercentageResult
          percentageChange={percentageChange}
          currentSalary={currentSalary}
          proposedSalary={proposedSalary}
        />
      </div>
    </>
  );
}