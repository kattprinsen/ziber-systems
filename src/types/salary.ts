export interface SalaryCalculation {
  userId: string;
  currentSalary: number;
  proposedSalary: number | null;
  percentageChange: number;
  calculatedAt: Date;
}

export interface SalaryValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export interface CurrencyFormatOptions {
  locale?: string;
  currency?: string;
  showSymbol?: boolean;
  showDecimals?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export interface PercentageFormatOptions {
  decimals?: number;
  showSign?: boolean;
  showSymbol?: boolean;
}

export interface SalaryUpdateRequest {
  currentSalary: number;
  effectiveDate: string;
  notes?: string;
}

export interface CalculationConfig {
  minSalary: number;
  maxSalary: number;
  warningThreshold: number;
}
