import { Request, Response } from 'express';
import userService from '../services/user.service.js';
import { ApiResponse, User } from '../types/user.types.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getAllUsers = asyncHandler(
  async (req: Request, res: Response<ApiResponse<User[]>>) => {
    const { department, status, search } = req.query;

    let users: User[];

    if (search && typeof search === 'string') {
      users = await userService.searchUsers(search);
    } else if (department && typeof department === 'string') {
      users = await userService.getUsersByDepartment(department);
    } else if (status && (status === 'active' || status === 'inactive' || status === 'on-leave')) {
      users = await userService.getUsersByStatus(status);
    } else {
      users = await userService.getAllUsers();
    }

    res.json({
      success: true,
      data: users,
      message: `Retrieved ${users.length} user(s)`,
    });
  }
);

export const getUserById = asyncHandler(
  async (req: Request, res: Response<ApiResponse<User>>) => {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    res.json({
      success: true,
      data: user,
    });
  }
);
