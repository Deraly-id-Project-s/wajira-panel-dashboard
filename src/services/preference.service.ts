import { apiClient } from '@/lib/api/client';

export type PreferenceValue = string | number | boolean | null | Record<string, unknown> | unknown[];

export interface PreferenceItem {
  key: string;
  value: PreferenceValue;
  description?: string | null;
  [key: string]: unknown;
}

type PreferenceResponse =
  | unknown[]
  | Record<string, unknown>
  | {
    data?: unknown[] | Record<string, unknown> | { data?: unknown[] | Record<string, unknown> };
  };

const basePath = '/wapi/settings/preference';

const isPreferenceItem = (value: unknown): value is PreferenceItem => {
  return Boolean(value && typeof value === 'object' && 'key' in value);
};

const normalizePreferenceItem = (value: unknown): PreferenceItem | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const item = value as Record<string, unknown>;
  const key = item.key
    ?? item.name
    ?? item.code
    ?? item.preference_key
    ?? item.config_key
    ?? item.setting_key
    ?? item.option_key
    ?? item.meta_key;
  if (typeof key !== 'string' || key.trim() === '') return null;

  const preferenceValue = item.value
    ?? item.preference_value
    ?? item.config_value
    ?? item.setting_value
    ?? item.option_value
    ?? item.meta_value
    ?? item.val
    ?? null;
  const description = item.description
    ?? item.desc
    ?? item.preference_description
    ?? item.setting_description
    ?? null;

  return {
    ...item,
    key,
    value: preferenceValue as PreferenceValue,
    description: typeof description === 'string' ? description : null,
  };
};

const objectToPreferenceList = (value: Record<string, PreferenceValue>): PreferenceItem[] => {
  return Object.entries(value).map(([key, preferenceValue]) => ({
    key,
    value: preferenceValue,
  }));
};

export const normalizePreferenceList = (response: PreferenceResponse): PreferenceItem[] => {
  let data: unknown = response;

  while (data && typeof data === 'object' && !Array.isArray(data) && 'data' in data) {
    data = (data as { data?: unknown }).data;
  }

  if (Array.isArray(data)) {
    return data
      .map(normalizePreferenceItem)
      .filter((item): item is PreferenceItem => Boolean(item));
  }

  if (data && typeof data === 'object') {
    const objectData = data as Record<string, unknown>;
    const nestedList = objectData.preferences ?? objectData.items ?? objectData.results;
    if (Array.isArray(nestedList)) {
      return nestedList
        .map(normalizePreferenceItem)
        .filter((item): item is PreferenceItem => Boolean(item));
    }
  }

  if (isPreferenceItem(data)) {
    return [data];
  }

  const normalizedItem = normalizePreferenceItem(data);
  if (normalizedItem) {
    return [normalizedItem];
  }

  if (data && typeof data === 'object') {
    return objectToPreferenceList(data as Record<string, PreferenceValue>);
  }

  return [];
};

export const getPreferenceValue = <T>(
  preferences: PreferenceItem[] | undefined,
  key: string,
  fallback: T,
): T => {
  const preference = preferences?.find((item) => item.key === key);
  return (preference?.value ?? fallback) as T;
};

const PREFERENCE_CACHE_KEY_PREFIX = 'company_preferences_';

export const getPreferenceCacheKey = (companyId: string | number): string => {
  return `${PREFERENCE_CACHE_KEY_PREFIX}${companyId}`;
};

export const getCachedPreferences = (companyId: string | number): PreferenceItem[] | null => {
  if (typeof window === 'undefined' || !companyId) return null;
  try {
    const cached = localStorage.getItem(getPreferenceCacheKey(companyId));
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[PreferenceService] Failed to parse cached preferences:', err);
  }
  return null;
};

export const setCachedPreferences = (
  companyId: string | number,
  preferences: PreferenceItem[],
): void => {
  if (typeof window === 'undefined' || !companyId) return;
  try {
    localStorage.setItem(getPreferenceCacheKey(companyId), JSON.stringify(preferences));
  } catch (err) {
    console.warn('[PreferenceService] Failed to save preferences to localStorage:', err);
  }
};

export const clearCachedPreferences = (companyId?: string | number): void => {
  if (typeof window === 'undefined') return;
  try {
    if (companyId !== undefined) {
      localStorage.removeItem(getPreferenceCacheKey(companyId));
    } else {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(PREFERENCE_CACHE_KEY_PREFIX) || key === 'company_preferences')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }
  } catch (err) {
    console.warn('[PreferenceService] Failed to clear cached preferences:', err);
  }
};

export interface FetchPreferencesOptions {
  forceRefresh?: boolean;
}

export const getPreferences = async (
  companyId: string | number,
  options: FetchPreferencesOptions = {},
): Promise<PreferenceItem[]> => {
  if (!companyId) return [];

  if (!options.forceRefresh && typeof window !== 'undefined') {
    const cached = getCachedPreferences(companyId);
    if (cached && cached.length > 0) {
      return cached;
    }
  }

  const response = await apiClient.get<PreferenceResponse>(basePath, {
    params: { company_id: companyId },
  });
  const normalized = normalizePreferenceList(response.data);

  setCachedPreferences(companyId, normalized);

  return normalized;
};

export const updatePreference = async (
  companyId: string | number,
  key: string,
  value: PreferenceValue,
): Promise<PreferenceItem[]> => {
  const response = await apiClient.put<PreferenceResponse>(`${basePath}/${companyId}`, {
    key,
    value,
  });
  const normalized = normalizePreferenceList(response.data);

  let updatedList: PreferenceItem[];
  if (normalized.length > 1 || (normalized.length === 1 && normalized[0].key !== key)) {
    updatedList = normalized;
  } else {
    const current = getCachedPreferences(companyId) || [];
    const index = current.findIndex((item) => item.key === key);
    if (index >= 0) {
      const updatedItem = normalized.find((item) => item.key === key) || {
        ...current[index],
        value,
      };
      updatedList = [...current];
      updatedList[index] = updatedItem;
    } else {
      const newItem = normalized.find((item) => item.key === key) || { key, value };
      updatedList = [...current, newItem];
    }
  }

  setCachedPreferences(companyId, updatedList);

  return updatedList;
};
