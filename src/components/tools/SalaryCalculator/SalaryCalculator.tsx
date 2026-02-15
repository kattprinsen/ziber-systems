import { useState, useEffect } from 'react';
import { MoneyInput } from '../MoneyInput';
import { EmployeeSelector } from '../MoneySlider/EmployeeSelector';
import { SalaryInput } from '../MoneySlider/SalaryInput';
import { PercentageDisplay } from '../MoneySlider/PercentageDisplay';
import { TwoColumnLayout, Column } from '../../layout';
import type { User } from '../../../types/user';
import userService from '../../../services/userService';
import { calculatePercentageFromIncrease, validateSalaryInput } from '../../../services/salaryCalculator';
import { SALARY_CONSTANTS } from '../../../utils/constants';

type CalculationMode = 'increase' | 'comparison';

export function SalaryCalculator() {
  const [mode, setMode] = useState<CalculationMode>('increase');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [increaseAmount, setIncreaseAmount] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  
  const selectedUser = users.find(u => u.id === selectedUserId);
  const currentSalary = selectedUser?.currentSalary ?? null;
  
  // Calculate percentage change in real-time
  const percentageChange = currentSalary !== null && increaseAmount !== null
    ? calculatePercentageFromIncrease(currentSalary, increaseAmount)
    : 0;

  // Fetch users on mount (for increase mode)
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

  const toggleMode = () => {
    setMode(prev => prev === 'increase' ? 'comparison' : 'increase');
  };

  if (isLoading && mode === 'increase') {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-center" role="status" aria-live="polite">
        <div className="flex flex-col items-center justify-center py-12">
          <svg 
            className="animate-spin h-12 w-12 text-orange-500 mb-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-400 text-lg">Loading employees...</p>
        </div>
      </div>
    );
  }

  if (error && mode === 'increase') {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-red-500" role="alert">
        <div className="flex items-start">
          <svg 
            className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-1" 
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
          <div className="flex-1">
            <h3 className="text-red-500 font-semibold mb-1">Error Loading Data</h3>
            <p className="text-gray-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label="Retry loading employees"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6" role="main" aria-label="Salary Calculator">
      {/* Header with toggle */}
      <div 
        onClick={toggleMode}
        className="cursor-pointer mb-6 pb-4 border-b border-gray-700 hover:border-orange-500 transition-colors"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleMode();
          }
        }}
        aria-label={`Switch to ${mode === 'increase' ? 'comparison' : 'increase'} calculator mode`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {mode === 'increase' ? 'Salary Increase Calculator' : 'Salary Comparison Calculator'}
          </h2>
          <div className="flex items-center text-sm text-gray-400">
            <span className="mr-2">Switch Mode</span>
            <svg 
              className="w-5 h-5 text-orange-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" 
              />
            </svg>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          {mode === 'increase' 
            ? 'Calculate percentage from raise amount' 
            : 'Compare current and proposed salaries'}
        </p>
      </div>

      {/* Content based on mode */}
      {mode === 'increase' ? (
        <>
          <EmployeeSelector
            users={users}
            selectedUserId={selectedUserId}
            onSelect={handleUserSelect}
          />
          
          {selectedUser && (
            <TwoColumnLayout
              gap="lg"
              leftColumn={
                <Column>
                  <SalaryInput
                    value={increaseAmount}
                    onChange={handleIncreaseChange}
                    currentSalary={currentSalary}
                    error={validationError}
                  />
                  
                  <div className="mt-6 bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-200 mb-2">Salary Change</h3>
                    <PercentageDisplay
                      percentageChange={percentageChange}
                      currentSalary={currentSalary}
                      increaseAmount={increaseAmount}
                    />
                  </div>
                </Column>
              }
              rightColumn={
                <Column>
                  <div />
                </Column>
              }
            />
          )}
          
          {!selectedUser && (
            <div className="mt-6 bg-gray-800 rounded-lg p-8 text-center" role="status">
              <svg 
                className="w-16 h-16 mx-auto mb-4 text-gray-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
              </svg>
              <p className="text-gray-400">Select an employee to calculate salary changes</p>
            </div>
          )}
        </>
      ) : (
        <MoneyInput />
      )}
    </div>
  );
}
