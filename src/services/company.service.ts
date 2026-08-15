import { apiClient } from '@/lib/api/client';
import { LaravelApiResponse, ensureSuccess } from '@/lib/api/response';

export interface CompanyModule {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Company {
  id: number;
  uuid?: string;
  name: string;
  slug: string;
  code?: string;
  description?: string | null;
  type?: string;
  created_at?: string | null;
  updated_at?: string | null;
  modules?: CompanyModule[];
}

type CompanyListApiResponse = LaravelApiResponse<Company[] | Company>;

export async function fetchUserCompanies(): Promise<Company[]> {
  const CACHE_KEY = 'user_companies';

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.warn('[CompanyService] Failed to parse cached companies:', err);
      }
    }
  }

  const response = await apiClient.get<CompanyListApiResponse>('/wapi/global/company');
  const data = ensureSuccess(response.data);
  const list = Array.isArray(data) ? data : data ? [data] : [];
  const filtered = list.filter((company) => company.id !== 5);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
    } catch (err) {
      console.warn('[CompanyService] Failed to save companies to localStorage:', err);
    }
  }

  // Filter out PT Adhiyas Agradasta (id = 5) from frontend display globally
  return filtered;
}

export function clearCachedUserCompanies(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user_companies');
  }
}

export async function fetchCompanyDetail(slug: string): Promise<Company> {
  const response = await apiClient.get<LaravelApiResponse<Company>>(`/wapi/global/company/${slug}`);
  const data = ensureSuccess(response.data);
  return data;
}
