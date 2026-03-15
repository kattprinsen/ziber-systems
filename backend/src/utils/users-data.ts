import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { User } from '../types/user.types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Canonical path to the internal users.json file.
 * This file is git-ignored and may contain real data.
 */
export const USERS_FILE_PATH = join(__dirname, '../data/users.json');

interface LoadUsersOptions {
  /**
   * When true, missing users.json will be treated as an empty array
   * instead of throwing. Useful for first-run sync.
   */
  allowMissing?: boolean;
}

/**
 * Load users from users.json with basic validation.
 */
export async function loadUsersFromFile(options: LoadUsersOptions = {}): Promise<User[]> {
  const { allowMissing = false } = options;

  try {
    const raw = await fs.readFile(USERS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error('users.json must contain a JSON array of users');
    }

    const users = parsed as User[];

    return users.map((user) => {
      const monthly = (user as User).monthlyHours;

      if (monthly && typeof monthly === 'object') {
        const normalized: Record<string, number> = {};

        for (const [key, value] of Object.entries(monthly)) {
          if (typeof value === 'number' && value >= 0) {
            normalized[key] = value;
          }
        }

        return { ...user, monthlyHours: normalized };
      }

      return user;
    });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;

    if (err.code === 'ENOENT' && allowMissing) {
      console.log('[Users Data] users.json not found, returning empty array');
      return [];
    }

    throw error;
  }
}
