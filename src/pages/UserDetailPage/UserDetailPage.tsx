import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { User } from '../../types/user';
import userService from '../../services/userService';
import { UserTimeSection } from '../../components/users';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadUser(id);
    }
  }, [id]);

  const loadUser = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getUserById(userId);
      
      if (!data) {
        setError('User not found');
      } else {
        setUser(data);
      }
    } catch (err) {
      setError('Failed to load user details. Please try again later.');
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    active: 'bg-green-500/20 text-green-400 border-green-500/50',
    inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    'on-leave': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  };

  const statusLabels = {
    active: 'Active',
    inactive: 'Inactive',
    'on-leave': 'On Leave',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-secondary">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-accent mx-auto mb-4"></div>
          <p>Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-red-400 mb-6">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{error || 'User not found'}</p>
        </div>
        <Link
          to="/users"
          className="inline-flex items-center text-orange-accent hover:text-orange-accent/80 transition-colors"
        >
          ← Back to Users
        </Link>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-text-secondary hover:text-orange-accent transition-colors mb-6 focus-orange"
      >
        <span className="mr-2">←</span>
        Back
      </button>

      {/* User Header */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-dark-border"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-orange-accent/20 flex items-center justify-center border-4 border-orange-accent">
                <span className="text-5xl font-bold text-orange-accent">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  {user.name}
                </h1>
                <p className="text-xl text-orange-accent mb-2">{user.role}</p>
                <p className="text-text-secondary">{user.department}</p>
              </div>
              <span
                className={`px-4 py-2 text-sm font-medium rounded-full border ${
                  statusColors[user.status]
                }`}
              >
                {statusLabels[user.status]}
              </span>
            </div>

            {user.bio && (
              <p className="text-text-secondary leading-relaxed">{user.bio}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Contact Information
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-text-secondary mb-1">Email</p>
              <a
                href={`mailto:${user.email}`}
                className="text-orange-accent hover:underline"
              >
                {user.email}
              </a>
            </div>
            {user.phone && (
              <div>
                <p className="text-sm text-text-secondary mb-1">Phone</p>
                <a
                  href={`tel:${user.phone}`}
                  className="text-text-primary hover:text-orange-accent transition-colors"
                >
                  {user.phone}
                </a>
              </div>
            )}
            {user.location && (
              <div>
                <p className="text-sm text-text-secondary mb-1">Location</p>
                <p className="text-text-primary flex items-center gap-1">
                  <span>📍</span>
                  {user.location}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Employment Details */}
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Employment Details
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-text-secondary mb-1">Department</p>
              <p className="text-text-primary">{user.department}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Role</p>
              <p className="text-text-primary">{user.role}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Joined Date</p>
              <p className="text-text-primary">{formatDate(user.joinedDate)}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Status</p>
              <p className="text-text-primary">{statusLabels[user.status]}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      {user.skills && user.skills.length > 0 && (
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Skills & Expertise
          </h2>
          <div className="flex flex-wrap gap-2">
            {user.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-2 bg-dark-bg border border-dark-border text-text-primary rounded-lg hover:border-orange-accent transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tidig Time Section (container only; logic added in US1) */}
      <UserTimeSection userId={user.id} />
    </div>
  );
}
