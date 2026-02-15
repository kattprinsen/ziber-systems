import type { SalaryValidationResult, CalculationConfig } from '../types/salary';

/**
 * Calculate percentage change between two salary values
 */
export function calculateSalaryPercentage(
  currentSalary: number,
  proposedSalary: number
): number {
  if (currentSalary === 0) {
    return 0; // Avoid division by zero
  }
  
  const change = ((proposedSalary - currentSalary) / currentSalary) * 100;
  return Number(change.toFixed(2)); // 2 decimal precision
}

/**
 * Calculate percentage from an increase amount
 */
export function calculatePercentageFromIncrease(
  currentSalary: number,
  increaseAmount: number
): number {
  if (currentSalary === 0) {
    return 0; // Avoid division by zero
  }
  
  const percentage = (increaseAmount / currentSalary) * 100;
  return Number(percentage.toFixed(2)); // 2 decimal precision
}

/**
 * Validate salary input value
 */
export function validateSalaryInput(
  value: number,
  config?: CalculationConfig
): SalaryValidationResult {
  const minSalary = config?.minSalary ?? 0;
  const maxSalary = config?.maxSalary ?? 10_000_000;
  const warningThreshold = config?.warningThreshold ?? 10_000_000;
  
  if (value < minSalary) {
    return {
      isValid: false,
      error: 'Salary must be a positive number'
    };
  }
  
  if (value > maxSalary) {
    return {
      isValid: false,
      error: `Salary exceeds maximum allowed value of $${maxSalary.toLocaleString()}`
    };
  }
  
  if (value > warningThreshold) {
    return {
      isValid: true,
      warning: `Salary exceeds $${warningThreshold.toLocaleString()}`
    };
  }
  
  return { isValid: true };
}
