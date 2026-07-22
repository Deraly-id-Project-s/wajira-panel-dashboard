import { apiClient } from '@/lib/api/client';
import { ApiResponse, PaginatedResponse, TaxVersion } from './tax.service';

export const getTaxVersions = async (page: number = 1, perPage: number = 25, search: string = '', tax_id?: number) => {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<TaxVersion>>>(`/wapi/settings/tax-version`, {
    params: { page, limit: perPage, search, tax_id },
  });
  return response.data;
};

export const getTaxVersionDetail = async (id: number) => {
  const response = await apiClient.get<ApiResponse<TaxVersion>>(`/wapi/settings/tax-version/${id}`);
  return response.data;
};

export interface CreateUpdateTaxVersionDTO {
  tax_id: number;
  name: string;
  rate: number;
  effective_from?: string;
  effective_until?: string;
  is_default: boolean;
}

export const createTaxVersion = async (data: CreateUpdateTaxVersionDTO) => {
  const formData = new FormData();
  formData.append('tax_id', String(data.tax_id));
  formData.append('name', data.name);
  formData.append('rate', String(data.rate));
  if (data.effective_from) formData.append('effective_from', data.effective_from);
  if (data.effective_until) formData.append('effective_until', data.effective_until);
  formData.append('is_default', data.is_default ? '1' : '0');
  
  const response = await apiClient.post<ApiResponse<TaxVersion>>(`/wapi/settings/tax-version`, formData);
  return response.data;
};

export const updateTaxVersion = async (id: number, data: CreateUpdateTaxVersionDTO) => {
  const formData = new FormData();
  formData.append('tax_id', String(data.tax_id));
  formData.append('name', data.name);
  formData.append('rate', String(data.rate));
  if (data.effective_from) formData.append('effective_from', data.effective_from);
  if (data.effective_until) formData.append('effective_until', data.effective_until);
  formData.append('is_default', data.is_default ? '1' : '0');
  formData.append('_method', 'PUT');

  const response = await apiClient.post<ApiResponse<TaxVersion>>(`/wapi/settings/tax-version/${id}`, formData);
  return response.data;
};

export const deleteTaxVersion = async (id: number) => {
  const response = await apiClient.delete<ApiResponse<any>>(`/wapi/settings/tax-version/${id}`);
  return response.data;
};
