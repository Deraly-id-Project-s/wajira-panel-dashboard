/**
 * API Client Configuration
 * Axios instance dengan interceptors untuk JWT authentication
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@/types/api';
import { getAccessToken, removeAccessToken } from '@/lib/auth/token';
import { clearStoredCompanyId, clearStoredPermissions } from '@/lib/session/storage';

// Default to hawk-dev backend to match master-data environment; override via NEXT_PUBLIC_API_URL when needed.
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://wajirabackend.hawk-dev.com';

/**
 * Base API Client dengan default configuration
 */
export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: { Accept: 'application/json' },
});

/**
 * Request Interceptor
 * Menambahkan JWT token ke setiap request
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    // NOTE: Master-data endpoints must NOT be scoped by company_id, so we no longer auto-append company_id here.
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * Response Interceptor
 * Handle API errors and enforce logout when backend rejects the token with 401.
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    // Handle 401 Unauthorized (token rejected by backend)
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('login');
      const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';

      // Clear token dan redirect ke login hanya jika bukan request login atau tidak sedang di halaman login
      if (!isLoginRequest && !isLoginPage) {
        if (typeof window !== 'undefined') {
          console.warn('[API Client] Received 401 - clearing token and redirecting to login');
          removeAccessToken();
          clearStoredCompanyId();
          clearStoredPermissions();
          window.location.href = '/login';
        }
      }
    }

    // Format error response
    const apiError: ApiError = {
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      message: error.response?.data?.message || error.message || 'An error occurred',
      details: (error.response?.data as any)?.errors || error.response?.data?.details,
      statusCode: error.response?.status,
    };

    return Promise.reject(apiError);
  },
);
