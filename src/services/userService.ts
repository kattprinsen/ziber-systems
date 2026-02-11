import apiClient from './api';
import type { User } from '../types/user';

export interface UserFilters {
  department?: string;
  status?: User['status'];
  search?: string;
}

class UserService {
  private endpoint = '/users';

  async getAllUsers(filters?: UserFilters): Promise<User[]> {
    const queryParams = new URLSearchParams();
    
    if (filters?.department) {
      queryParams.append('department', filters.department);
    }
    if (filters?.status) {
      queryParams.append('status', filters.status);
    }
    if (filters?.search) {
      queryParams.append('search', filters.search);
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<User[]>(endpoint);
    return response.data || [];
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const response = await apiClient.get<User>(`${this.endpoint}/${id}`);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error);
      return null;
    }
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.getAllUsers({ search: query });
  }

  async getUsersByDepartment(department: string): Promise<User[]> {
    return this.getAllUsers({ department });
  }

  async getUsersByStatus(status: User['status']): Promise<User[]> {
    return this.getAllUsers({ status });
  }
}

export default new UserService();
