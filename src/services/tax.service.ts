import { apiClient } from '@/lib/api/client';

export interface TaxVersion {
  id: number;
  tax_id: number;
  name: string;
  rate: number;
  effective_from: string | null;
  effective_until: string | null;
  is_default: number | boolean;
  is_lock?: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Tax {
  id: number;
  code: string;
  name: string;
  is_lock: number | boolean;
  created_at: string;
  updated_at?: string;
  tax_versions?: TaxVersion[];
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: any[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface ApiResponse<T> {
  status: boolean;
  message: string;
  errors: any;
  data: T;
}

export const getTaxes = async (page: number = 1, perPage: number = 25, search: string = '') => {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<Tax>>>(`/wapi/settings/tax`, {
    params: { page, limit: perPage, search },
  });
  return response.data;
};

export const getTaxDetail = async (id: number) => {
  const response = await apiClient.get<ApiResponse<Tax>>(`/wapi/settings/tax/${id}`);
  return response.data;
};

export const getDefaultTaxByCode = async (taxCode: string) => {
  const response = await apiClient.get<ApiResponse<TaxVersion>>(`/wapi/settings/tax/${taxCode}/default`);
  return response.data;
};

export const createTax = async (data: { code: string; name: string }) => {
  const formData = new FormData();
  formData.append('code', data.code);
  formData.append('name', data.name);
  const response = await apiClient.post<ApiResponse<Tax>>(`/wapi/settings/tax`, formData);
  return response.data;
};

export const updateTax = async (id: number, data: { code: string; name: string }) => {
  const formData = new FormData();
  formData.append('code', data.code);
  formData.append('name', data.name);
  formData.append('_method', 'PUT');
  const response = await apiClient.post<ApiResponse<Tax>>(`/wapi/settings/tax/${id}`, formData);
  return response.data;
};

export const deleteTax = async (id: number) => {
  const response = await apiClient.delete<ApiResponse<any>>(`/wapi/settings/tax/${id}`);
  return response.data;
};
