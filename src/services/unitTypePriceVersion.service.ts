import { apiClient } from '@/lib/api/client';
import { ensureSuccess, type LaravelApiResponse } from '@/lib/api/response';
import type { UnitTypePriceVersion, UnitTypePriceVersionFilterParams } from '@/types/unit-type-price-version.types';

const basePath = '/wapi/master-data/unit-type-price-version';

export const getUnitTypePriceVersions = async (params: UnitTypePriceVersionFilterParams) => {
  const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
    params: {
      unit_type_id: params.unit_type_id,
      is_lock: params.is_lock !== undefined ? (params.is_lock ? 1 : 0) : undefined,
      is_default: params.is_default !== undefined ? (params.is_default ? 1 : 0) : undefined,
      search: params.search || undefined,
      page: params.page ?? 1,
      per_page: params.per_page ?? 25,
    },
  });
  return ensureSuccess(response.data);
};

export const createUnitTypePriceVersion = async (data: any): Promise<UnitTypePriceVersion> => {
  const formData = new FormData();
  formData.append('unit_type_id', String(data.unit_type_id));
  formData.append('name', data.name);
  formData.append('buy_price', String(data.buy_price));
  formData.append('sell_price', String(data.sell_price));
  if (data.effective_from) formData.append('effective_from', data.effective_from);
  if (data.effective_until) formData.append('effective_until', data.effective_until);
  formData.append('is_default', data.is_default ? '1' : '0');

  const response = await apiClient.post<LaravelApiResponse<UnitTypePriceVersion>>(basePath, formData);
  return ensureSuccess(response.data);
};

export const updateUnitTypePriceVersion = async (id: number | string, data: any): Promise<UnitTypePriceVersion> => {
  const formData = new FormData();
  formData.append('unit_type_id', String(data.unit_type_id));
  formData.append('name', data.name);
  formData.append('buy_price', String(data.buy_price));
  formData.append('sell_price', String(data.sell_price));
  if (data.effective_from) formData.append('effective_from', data.effective_from);
  if (data.effective_until) formData.append('effective_until', data.effective_until);
  formData.append('is_default', data.is_default ? '1' : '0');
  formData.append('_method', 'PUT');

  const response = await apiClient.post<LaravelApiResponse<UnitTypePriceVersion>>(`${basePath}/${id}`, formData);
  return ensureSuccess(response.data);
};

export const deleteUnitTypePriceVersion = async (id: number | string): Promise<any> => {
  const response = await apiClient.delete<LaravelApiResponse<any>>(`${basePath}/${id}`);
  return ensureSuccess(response.data);
};
