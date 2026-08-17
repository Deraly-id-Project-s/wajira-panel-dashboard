import { apiClient } from '@/lib/api/client';
import { ensureSuccess, type LaravelApiResponse } from '@/lib/api/response';
import type { TarifPriceVersion, TarifPriceVersionFilterParams, TarifPriceVersionFormValues } from '@/@types/tarif-price-version.types';

const basePath = '/wapi/master-data/tarif-price-version';

export const getTarifPriceVersions = async (params: TarifPriceVersionFilterParams) => {
  const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
    params: {
      tarif_id: params.tarif_id,
      is_lock: params.is_lock !== undefined ? (params.is_lock ? 1 : 0) : undefined,
      is_default: params.is_default !== undefined ? (params.is_default ? 1 : 0) : undefined,
      search: params.search || undefined,
      page: params.page ?? 1,
      per_page: params.per_page ?? 25,
    },
  });
  return ensureSuccess(response.data);
};

const toFormData = (data: any, method?: string) => {
  const formData = new FormData();
  formData.append('tarif_id', String(data.tarif_id));
  formData.append('name', data.name);
  formData.append('uj_towing', String(data.uj_towing ?? 0));
  formData.append('uj_cdd', String(data.uj_cdd ?? 0));
  formData.append('uj_fuso', String(data.uj_fuso ?? 0));
  if (data.effective_from) formData.append('effective_from', data.effective_from);
  if (data.effective_until) formData.append('effective_until', data.effective_until);
  formData.append('is_default', data.is_default ? '1' : '0');
  if (data.is_lock !== undefined) formData.append('is_lock', data.is_lock ? '1' : '0');
  if (method) formData.append('_method', method);
  return formData;
};

export const createTarifPriceVersion = async (data: TarifPriceVersionFormValues & { tarif_id: number | string }): Promise<TarifPriceVersion> => {
  const response = await apiClient.post<LaravelApiResponse<TarifPriceVersion>>(basePath, toFormData(data));
  return ensureSuccess(response.data);
};

export const updateTarifPriceVersion = async (id: number | string, data: TarifPriceVersionFormValues & { tarif_id: number | string }): Promise<TarifPriceVersion> => {
  const response = await apiClient.post<LaravelApiResponse<TarifPriceVersion>>(`${basePath}/${id}`, toFormData(data, 'PUT'));
  return ensureSuccess(response.data);
};

export const deleteTarifPriceVersion = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<any>>(`${basePath}/${id}`);
  ensureSuccess(response.data);
};
