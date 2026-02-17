import { useState, useEffect } from 'react';
import { EmployeeSelector } from './EmployeeSelector';
import { SalaryInput } from './SalaryInput';
import { PercentageDisplay } from './PercentageDisplay';
import type { User } from '../../../types/user';
import userService from '../../../services/userService';
import { calculatePercentageFromIncrease, calculateSalaryByPercentage, validateSalaryInput } from '../../../services/salaryCalculator';
import { SALARY_CONSTANTS } from '../../../utils/constants';

export function MoneySlider() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [increaseAmount, setIncreaseAmount] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [calculationMode, setCalculationMode] = useState<'amount' | 'percentage'>('amount');
  
  const selectedUser = users.find(u => u.id === selectedUserId);
  const currentSalary = selectedUser?.currentSalary ?? null;
  
  // Calculate percentage change or new salary based on mode
  let percentageChange = 0;
  let newSalary: number | null = null;
  
  if (currentSalary !== null && increaseAmount !== null && increaseAmount !== 0) {
    if (calculationMode === 'amount') {
      percentageChange = calculatePercentageFromIncrease(currentSalary, increaseAmount);
      newSalary = currentSalary + increaseAmount;
    } else {
      newSalary = calculateSalaryByPercentage(currentSalary, increaseAmount);
      percentageChange = increaseAmount;
    }
  }

  // Fetch users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await userService.getAllUsers();
        
        // Filter to only users with salary data
        const usersWithSalary = data.filter((u: User) => u.currentSalary !== undefined && u.currentSalary !== null);
        
        if (usersWithSalary.length === 0) {
          setError('No employees with salary data found');
        }
        
        setUsers(usersWithSalary);
      } catch (err) {
        setError('Failed to load employee data');
        console.error('Error loading users:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUsers();
  }, []);

  // Handle user selection
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setIncreaseAmount(null);
    setValidationError('');
  };

  // Handle calculation mode change
  const handleModeChange = (mode: 'amount' | 'percentage') => {
    setCalculationMode(mode);
    setIncreaseAmount(null);
    setValidationError('');
  };

  // Handle salary increase input with validation
  const handleIncreaseChange = (value: number) => {
    setIncreaseAmount(value);
    
    // Validate input
    const validation = validateSalaryInput(value, {
      minSalary: SALARY_CONSTANTS.MIN_SALARY,
      maxSalary: SALARY_CONSTANTS.MAX_SALARY,
      warningThreshold: SALARY_CONSTANTS.MAX_SALARY
    });
    
    setValidationError(validation.isValid ? '' : validation.error || '');
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-center">
        <p className="text-gray-400">Loading employees...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-red-500">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6 text-white">Money Slider</h2>
      
      <EmployeeSelector
        users={users}
        selectedUserId={selectedUserId}
        onSelect={handleUserSelect}
      />
      
      {selectedUser && (
        <>
          {/* Calculation Mode Toggle */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => handleModeChange('amount')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                calculationMode === 'amount'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              By Amount
            </button>
            <button
              onClick={() => handleModeChange('percentage')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                calculationMode === 'percentage'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              By Percentage
            </button>
          </div>
          
          <SalaryInput
            value={increaseAmount}
            onChange={handleIncreaseChange}
            currentSalary={currentSalary}
            error={validationError}
            mode={calculationMode}
          />
          
          <div className="mt-6 bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-200 mb-2">
              {calculationMode === 'amount' ? 'Salary Change' : 'Salary Increase Result'}
            </h3>
            <PercentageDisplay
              percentageChange={percentageChange}
              currentSalary={currentSalary}
              increaseAmount={increaseAmount}
              newSalary={newSalary}
              mode={calculationMode}
            />
          </div>
        </>
      )}
      
      {!selectedUser && (
        <div className="mt-6 bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">Select an employee to calculate salary changes</p>
        </div>
      )}
    </div>
  );
}
