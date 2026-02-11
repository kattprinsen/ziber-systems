import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { User } from '../types/user.types.js';
import { AppError } from '../middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class UserService {
  private usersFilePath: string;
  private usersCache: User[] | null = null;

  constructor() {
    this.usersFilePath = join(__dirname, '../data/users.json');
  }

  private async loadUsers(): Promise<User[]> {
    try {
      if (this.usersCache) {
        return this.usersCache;
      }

      const fileContent = await readFile(this.usersFilePath, 'utf-8');
      this.usersCache = JSON.parse(fileContent);
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
