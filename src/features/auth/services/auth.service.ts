import { apiClient } from '@/lib/api/client';
import { AuthResponse, LoginRequest, ProfileResponse } from '../types/auth.types';

export class AuthService {
  /**
   * Logs in a user using email and password against the backend API.
   *
   * Handles custom business logic responses (e.g. Account not activated or Invalid credentials)
   * which return 200 OK with `status: false` instead of standard HTTP error codes.
   */
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const body = new URLSearchParams();
    const loginValue = credentials.login || credentials.email; // backend uses `login` (email/username)
    if (loginValue) body.append('login', loginValue);
    if (credentials.password) body.append('password', credentials.password);

    const response = await apiClient.post<AuthResponse>(`/wapi/auth/login`, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    // Check if business logic failed even with 200 OK HTTP status
    if (!response.data.status) {
      throw new Error(response.data.message || 'Login failed');
    }

    return response.data;
  }

  static async me(): Promise<ProfileResponse> {
    const response = await apiClient.get<ProfileResponse>('/wapi/auth/me');

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to fetch profile');
    }

    return response.data;
  }

  static async getPermissions(): Promise<string[]> {
    const response = await apiClient.get<any>('/wapi/auth/has-permissions');
    let resData = response.data;
    if (typeof resData === 'string') {
      try {
        resData = JSON.parse(resData);
      } catch (e) {
        console.error('[AuthService] Failed to parse has-permissions JSON string:', e);
      }
    }

    if (!resData || !resData.status) {
      throw new Error(resData?.message || 'Failed to fetch permissions');
    }

    const permissions = resData.data?.permissions || resData.permissions || [];
    return permissions;
  }

  static async updateProfile(id: number, data: { name?: string; username?: string; firstname?: string; lastname?: string; email?: string; avatar?: File | null }): Promise<ProfileResponse> {
    const body = new FormData();
    if (data.name) body.append('name', data.name);
    if (data.username) body.append('username', data.username);
    if (data.firstname) body.append('firstname', data.firstname);
    if (data.lastname) body.append('lastname', data.lastname);
    if (data.email) body.append('email', data.email);
    if (data.avatar) body.append('avatar', data.avatar);
    body.append('_method', 'PUT');

    const response = await apiClient.post<ProfileResponse>(`/wapi/auth/me`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to update profile');
    }

    return response.data;
  }
}

