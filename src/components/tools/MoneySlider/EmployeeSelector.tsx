import type { User } from '../../../types/user';

interface EmployeeSelectorProps {
  users: User[];
  selectedUserId: string | null;
  onSelect: (userId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function EmployeeSelector({
  users,
  selectedUserId,
  onSelect,
  disabled = false,
  className = ''
}: EmployeeSelectorProps) {
  const sortedUsers = [...users].sort((a, b) => {
    const aLastName = a.name.split(' ').pop() || '';
    const bLastName = b.name.split(' ').pop() || '';
    return aLastName.localeCompare(bLastName);
  });

  return (
    <div className={`mb-4 ${className}`}>
      <label 
        htmlFor="employee-select" 
        className="block text-sm font-medium mb-2 text-gray-200"
      >
        Select Employee
      </label>
      <select
        id="employee-select"
        value={selectedUserId || ''}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border rounded-lg bg-gray-800 border-gray-700 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
        aria-label="Select employee"
        aria-required="true"
      >
        <option value="">Select an employee...</option>
        {sortedUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} - {user.department}
          </option>
        ))}
      </select>
    </div>
  );
}
