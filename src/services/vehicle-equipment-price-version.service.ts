import { apiClient } from '@/lib/api/client';
import { ensureSuccess, type LaravelApiResponse } from '@/lib/api/response';
import type {
  VehicleEquipmentPriceVersion,
  VehicleEquipmentPriceVersionFilterParams,
  VehicleEquipmentPriceVersionFormValues,
} from '@/@types/vehicle-equipment-price-version.types';

const basePath = '/wapi/master-data/vehicle-equipment-price-version';

export const getVehicleEquipmentPriceVersions = async (params: VehicleEquipmentPriceVersionFilterParams) => {
  const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
    params: {
      vehicle_equipment_id: params.vehicle_equipment_id,
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
  formData.append('vehicle_equipment_id', String(data.vehicle_equipment_id));
  formData.append('name', data.name);
  formData.append('buy_price', String(data.buy_price ?? 0));
  formData.append('sell_price', String(data.sell_price ?? 0));
  if (data.effective_from) formData.append('effective_from', data.effective_from);
  if (data.effective_until) formData.append('effective_until', data.effective_until);
  formData.append('is_default', data.is_default ? '1' : '0');
  if (data.is_lock !== undefined) formData.append('is_lock', data.is_lock ? '1' : '0');
  if (method) formData.append('_method', method);
  return formData;
};

export const createVehicleEquipmentPriceVersion = async (
  data: VehicleEquipmentPriceVersionFormValues & { vehicle_equipment_id: number | string },
): Promise<VehicleEquipmentPriceVersion> => {
  const response = await apiClient.post<LaravelApiResponse<VehicleEquipmentPriceVersion>>(basePath, toFormData(data));
  return ensureSuccess(response.data);
};

export const updateVehicleEquipmentPriceVersion = async (
  id: number | string,
  data: VehicleEquipmentPriceVersionFormValues & { vehicle_equipment_id: number | string },
): Promise<VehicleEquipmentPriceVersion> => {
  const response = await apiClient.post<LaravelApiResponse<VehicleEquipmentPriceVersion>>(`${basePath}/${id}`, toFormData(data, 'PUT'));
  return ensureSuccess(response.data);
};

export const deleteVehicleEquipmentPriceVersion = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<any>>(`${basePath}/${id}`);
  ensureSuccess(response.data);
};
