const ACCESS_TOKEN_KEY = 'auth_token';

/** Last timestamp when token validity was checked (in milliseconds). */
let lastTokenCheckTime = 0;

/** Minimum interval between token validity checks in milliseconds (2 minutes). */
const TOKEN_CHECK_THROTTLE_MS = 2 * 60 * 1000;

let inMemoryToken: string | null = null;

export type TokenValidityStatus = 'valid' | 'invalid' | 'unknown';

const isBrowser = (): boolean => typeof window !== 'undefined';

export const setAccessToken = (token: string): void => {
  if (isBrowser()) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
  inMemoryToken = token;
};

export const getAccessToken = (): string | null => {
  if (inMemoryToken) {
    return inMemoryToken;
  }

  if (isBrowser()) {
    const stored = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (stored) {
      inMemoryToken = stored;
      return stored;
    }
  }

  return null;
};

export const removeAccessToken = (): void => {
  if (isBrowser()) {
    // ini ta tambahkan preferensi buat hapus seluruh data yang tersimpan pada local storage pada data statis
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem('user_companies');
    localStorage.removeItem('auth_user_profile');
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('dashboard_permissions');
    localStorage.removeItem('user_sidebar');
  }
  inMemoryToken = null;
};

/**
 * Check if enough time has passed since the last token validation check.
 * Used for throttling to prevent excessive API calls.
 */
export const isTokenCheckThrottled = (): boolean => {
  const now = Date.now();
  return now - lastTokenCheckTime < TOKEN_CHECK_THROTTLE_MS;
};

/**
 * Record the latest token validation attempt.
 */
export const markTokenCheckAttempt = (): void => {
  lastTokenCheckTime = Date.now();
};

/**
 * Proactively validate the current token by calling the backend /check-token endpoint.
 * Returns:
 * - `valid` when backend explicitly accepts the token
 * - `invalid` when backend explicitly rejects the token
 * - `unknown` when the check cannot be completed due to network/server issues
 */
export const checkTokenValidity = async (): Promise<TokenValidityStatus> => {
  try {
    const token = getAccessToken();
    if (!token) return 'invalid';

    const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'https://wajirabackend.hawk-dev.com').replace(/\/$/, '');
    const url = `${apiBaseUrl}/wapi/auth/check-token`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      return 'invalid';
    }

    if (!response.ok) {
      return 'unknown';
    }

    const data = await response.json();
    return data?.status === true ? 'valid' : 'invalid';
  } catch (error: any) {
    console.warn('[Token Validation] Error checking token validity:', error?.message || error);
    return 'unknown';
  }
};
