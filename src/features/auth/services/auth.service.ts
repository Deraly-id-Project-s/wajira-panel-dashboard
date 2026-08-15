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
    const CACHE_KEY = 'auth_user_profile';

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.status === true && parsed.data) {
            return parsed;
          }
        } catch (err) {
          console.warn('[AuthService] Failed to parse cached profile:', err);
        }
      }
    }

    const response = await apiClient.get<ProfileResponse>('/wapi/auth/me');

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to fetch profile');
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
      } catch (err) {
        console.warn('[AuthService] Failed to save profile to localStorage:', err);
      }
    }

    return response.data;
  }

  static async getPermissions(): Promise<string[]> {
    const CACHE_KEY = 'user_permissions';

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (err) {
          console.warn('[AuthService] Failed to parse cached permissions:', err);
        }
      }
    }

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

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(permissions));
      } catch (err) {
        console.warn('[AuthService] Failed to save permissions to localStorage:', err);
      }
    }

    return permissions;
  }

  static async getSidebar(): Promise<SidebarModuleItem[]> {
    const CACHE_KEY = 'user_sidebar';

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (err) {
          console.warn('[AuthService] Failed to parse cached sidebar:', err);
        }
      }
    }

    const response = await apiClient.get<SidebarResponse>('/wapi/auth/get-sidebar');

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to fetch sidebar');
    }

    const data = response.data.data || [];

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch (err) {
        console.warn('[AuthService] Failed to save sidebar to localStorage:', err);
      }
    }

    return data;
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

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('auth_user_profile', JSON.stringify(response.data));
      } catch (err) {
        console.warn('[AuthService] Failed to update cached profile:', err);
      }
    }

    return response.data;
  }

  static clearCachedProfile(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user_profile');
      localStorage.removeItem('user_permissions');
      localStorage.removeItem('user_sidebar');
    }
  }
}

export interface SidebarFeature {
  id: number;
  slug: string;
  name: string;
  description: string;
}

export interface SidebarModuleItem {
  module: {
    id: number;
    name: string;
    slug: string;
    description: string;
  };
  features: SidebarFeature[];
}

export interface SidebarResponse {
  status: boolean;
  message: string;
  errors: any;
  data: SidebarModuleItem[];
}
