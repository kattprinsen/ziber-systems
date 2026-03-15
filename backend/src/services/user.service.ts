import { User } from '../types/user.types.js';
import { AppError } from '../middleware/errorHandler.js';
import { loadUsersFromFile } from '../utils/users-data.js';

class UserService {
  private usersCache: User[] | null = null;

  constructor() {
  }

  private async loadUsers(): Promise<User[]> {
    try {
      if (this.usersCache) {
        return this.usersCache;
      }

      this.usersCache = await loadUsersFromFile();
      return this.usersCache!;
    } catch (error) {
      console.error('Error loading users:', error);
      throw new AppError('Failed to load users data', 500);
    }
  }

  async getAllUsers(): Promise<User[]> {
    const users = await this.loadUsers();
    return users;
  }

  async getUserById(id: string): Promise<User> {
    const users = await this.loadUsers();
    const user = users.find((u) => u.id === id);

    if (!user) {
      throw new AppError(`User with id ${id} not found`, 404);
    }

    return user;
  }

  async getUsersByDepartment(department: string): Promise<User[]> {
    const users = await this.loadUsers();
    return users.filter(
      (u) => u.department.toLowerCase() === department.toLowerCase()
    );
  }

  async getUsersByStatus(status: User['status']): Promise<User[]> {
    const users = await this.loadUsers();
    return users.filter((u) => u.status === status);
  }

  async searchUsers(query: string): Promise<User[]> {
    const users = await this.loadUsers();
    const searchQuery = query.toLowerCase();

    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery) ||
        u.email.toLowerCase().includes(searchQuery) ||
        u.role.toLowerCase().includes(searchQuery) ||
        u.department.toLowerCase().includes(searchQuery)
    );
  }

  // Clear cache when needed (e.g., after data updates)
  clearCache(): void {
    this.usersCache = null;
  }
}

export default new UserService();
