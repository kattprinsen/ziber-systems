/**
 * Tidig API Client
 * 
 * Configured axios instance for making requests to the Tidig API with:
 * - 5-second timeout
 * - API key authentication via x-apikey header
 * - Request/response logging
 * - Error handling for timeouts and network issues
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import 'dotenv/config';

// ============================================================================
// Configuration
// ============================================================================

const TIDIG_API_URL = process.env.TIDIG_API_URL;
const TIDIG_API_KEY = process.env.TIDIG_API_KEY;
const TIDIG_API_TIMEOUT = parseInt(process.env.TIDIG_API_TIMEOUT || '5000', 10);

// Validate required environment variables
if (!TIDIG_API_URL || !TIDIG_API_KEY) {
  throw new Error(
    'Tidig API configuration missing. Check TIDIG_API_URL and TIDIG_API_KEY environment variables.'
  );
}

// ============================================================================
// Axios Instance
// ============================================================================

export const tidigClient: AxiosInstance = axios.create({
  baseURL: TIDIG_API_URL,
  timeout: TIDIG_API_TIMEOUT,
  headers: {
    'x-apikey': TIDIG_API_KEY,
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// Request Interceptor (Logging)
// ============================================================================

tidigClient.interceptors.request.use(
  (config) => {
    const method = config.method?.toUpperCase() || 'GET';
    const url = config.url || '';
    console.log(`[Tidig API] → ${method} ${url}`);
    return config;
  },
  (error) => {
    console.error('[Tidig API] Request error:', error.message);
    return Promise.reject(error);
  }
);

// ============================================================================
// Response Interceptor (Logging & Error Handling)
// ============================================================================

tidigClient.interceptors.response.use(
  (response) => {
    const status = response.status;
    const url = response.config.url || '';
    console.log(`[Tidig API] ← ${status} from ${url}`);
    return response;
  },
  (error: AxiosError) => {
    // Handle different error types
    if (error.code === 'ECONNABORTED') {
      // Timeout error
      console.error('[Tidig API] ✗ Request timeout (>5 seconds)');
      const timeoutError = new TidigApiError(
        'SYNC_TIMEOUT',
        'Request to Tidig API timed out after 5 seconds',
        error
      );
      return Promise.reject(timeoutError);
    } else if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const url = error.config?.url || '';
      console.error(`[Tidig API] ✗ Error ${status} from ${url}`);

      // Map HTTP status to error code
      if (status === 401) {
        return Promise.reject(
          new TidigApiError(
            'SYNC_AUTH_FAILED',
            'Invalid or missing API key',
            error
          )
        );
      } else if (status === 403) {
        return Promise.reject(
          new TidigApiError(
            'SYNC_AUTH_FAILED',
            'Insufficient permissions for Tidig API',
            error
          )
        );
      } else {
        return Promise.reject(
          new TidigApiError(
            'SYNC_API_ERROR',
            `Tidig API returned error ${status}`,
            error
          )
        );
      }
    } else if (error.request) {
      // Request made but no response received (network error)
      const errorDetails = {
        message: error.message,
        code: error.code,
        hostname: error.config?.baseURL,
      };
      console.error('[Tidig API] ✗ Network error:', JSON.stringify(errorDetails, null, 2));
      console.error('[Tidig API] This usually means:');
      console.error('[Tidig API]   1. DNS cannot resolve the hostname');
      console.error('[Tidig API]   2. The server is not reachable');
      console.error('[Tidig API]   3. Firewall/network blocking the connection');
      return Promise.reject(
        new TidigApiError(
          'SYNC_NETWORK_ERROR',
          `Network error connecting to Tidig API: ${error.message}`,
          error
        )
      );
    } else {
      // Something else went wrong
      console.error('[Tidig API] ✗ Unknown error:', error.message);
      return Promise.reject(error);
    }
  }
);

// ============================================================================
// Custom Error Class
// ============================================================================

export class TidigApiError extends Error {
  public code: string;
  public originalError?: AxiosError;

  constructor(code: string, message: string, originalError?: AxiosError) {
    super(message);
    this.name = 'TidigApiError';
    this.code = code;
    this.originalError = originalError;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if an error is a TidigApiError
 */
export function isTidigApiError(error: unknown): error is TidigApiError {
  return error instanceof TidigApiError;
}

/**
 * Extract error code from any error
 */
export function getErrorCode(error: unknown): string {
  if (isTidigApiError(error)) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}

/**
 * Extract error message from any error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
