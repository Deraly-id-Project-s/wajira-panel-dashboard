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

export const getPreferences = async (companyId: string | number): Promise<PreferenceItem[]> => {
  const response = await apiClient.get<PreferenceResponse>(basePath, {
    params: { company_id: companyId },
  });
  return normalizePreferenceList(response.data);
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
  return normalizePreferenceList(response.data);
};
