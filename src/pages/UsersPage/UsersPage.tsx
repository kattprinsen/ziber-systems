import { useEffect, useState } from 'react';
import { UserCard } from '../../components/users';
import type { User } from '../../types/user';
import userService from '../../services/userService';

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadUsers();
  }, [selectedDepartment, selectedStatus, searchQuery]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {};
      
      if (searchQuery) {
        filters.search = searchQuery;
      } else {
        if (selectedDepartment !== 'all') {
          filters.department = selectedDepartment;
        }
        if (selectedStatus !== 'all') {
          filters.status = selectedStatus;
        }
      }

      const data = await userService.getAllUsers(filters);
      setUsers(data);
    } catch (err) {
      setError('Failed to load users. Please try again later.');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const departments = ['all', 'Engineering', 'Product', 'Design', 'Analytics'];
  const statuses = ['all', 'active', 'inactive', 'on-leave'];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Team Members</h1>
        <p className="text-text-secondary">
          Browse and connect with your colleagues
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search by name, email, role, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-orange-accent transition-colors"
          />
        </div>

        {/* Department and Status Filters */}
        {!searchQuery && (
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-text-secondary mb-2">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-text-primary focus:outline-none focus:border-orange-accent transition-colors"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept.charAt(0).toUpperCase() + dept.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-text-secondary mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-text-primary focus:outline-none focus:border-orange-accent transition-colors"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-text-secondary">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-accent mx-auto mb-4"></div>
            <p>Loading users...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Users Grid */}
      {!loading && !error && (
        <>
          {users.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-text-secondary">
                Showing {users.length} user{users.length !== 1 ? 's' : ''}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-text-secondary text-lg mb-2">No users found</p>
              <p className="text-text-secondary text-sm">
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
