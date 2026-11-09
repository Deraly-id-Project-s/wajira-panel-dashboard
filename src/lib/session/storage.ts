const COMPANY_ID_KEY = 'company_id';
const USER_PERMISSIONS_KEY = 'user_permissions';

const isBrowser = (): boolean => typeof window !== 'undefined';

export const storageKeys = {
  companyId: COMPANY_ID_KEY,
  userPermissions: USER_PERMISSIONS_KEY,
} as const;

export const getStoredCompanyId = (): string | null => {
  if (!isBrowser()) return null;
  return localStorage.getItem(COMPANY_ID_KEY);
};

export const setStoredCompanyId = (companyId: string): void => {
  if (!isBrowser()) return;
  localStorage.setItem(COMPANY_ID_KEY, companyId);
};

export const clearStoredCompanyId = (): void => {
  if (!isBrowser()) return;
  localStorage.removeItem(COMPANY_ID_KEY);
};

export const getStoredPermissions = (): string[] => {
  if (!isBrowser()) return [];

  try {
    const raw = localStorage.getItem(USER_PERMISSIONS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((permission): permission is string => typeof permission === 'string');
  } catch {
    return [];
  }
};

export const setStoredPermissions = (permissions: string[]): void => {
  if (!isBrowser()) return;
  localStorage.setItem(USER_PERMISSIONS_KEY, JSON.stringify(permissions));
};

export const clearStoredPermissions = (): void => {
  if (!isBrowser()) return;
  localStorage.removeItem(USER_PERMISSIONS_KEY);
};

export const TABLE_VISIBILITY_PREFIX = 'table_hidden_cols_';

export const clearAllTableVisibilityPreferences = (): void => {
  if (!isBrowser()) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(TABLE_VISIBILITY_PREFIX) || key.startsWith('table_visibility_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (err) {
    console.warn('Failed to clear table visibility preferences', err);
  }
};
