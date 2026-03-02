import { Link } from 'react-router-dom';
import type { User } from '../../types/user';
import { MarginCardIndicator } from './MarginCardIndicator';

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  const statusColors = {
    active: 'bg-green-500/20 text-green-400',
    inactive: 'bg-gray-500/20 text-gray-400',
    'on-leave': 'bg-yellow-500/20 text-yellow-400',
  };

  const statusLabels = {
    active: 'Active',
    inactive: 'Inactive',
    'on-leave': 'On Leave',
  };

  return (
    <Link
      to={`/users/${user.id}`}
      className="block bg-dark-surface border border-dark-border rounded-lg p-6 hover:border-orange-accent transition-colors duration-200 focus-orange"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-dark-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-orange-accent/20 flex items-center justify-center border-2 border-orange-accent">
              <span className="text-2xl font-bold text-orange-accent">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-text-primary truncate">
              {user.name}
            </h3>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                statusColors[user.status]
              }`}
            >
              {statusLabels[user.status]}
            </span>
          </div>

          <p className="text-sm text-orange-accent mb-2 truncate">{user.role}</p>

          <div className="space-y-1 text-sm text-text-secondary">
            <p className="truncate">{user.department}</p>
            <p className="truncate">{user.email}</p>
            {user.location && (
              <p className="flex items-center gap-1 truncate">
                <span>📍</span>
                {user.location}
              </p>
            )}
          </div>

          {/* Skills Preview */}
          {user.skills && user.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {user.skills.slice(0, 3).map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-dark-bg text-text-secondary rounded"
                >
                  {skill}
                </span>
              ))}
              {user.skills.length > 3 && (
                <span className="px-2 py-1 text-xs text-orange-accent">
                  +{user.skills.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Margin indicator — feature 006 */}
          <div className="mt-3">
            <MarginCardIndicator hourlyRate={user.hourlyRate} />
          </div>
        </div>
      </div>
    </Link>
  );
}
