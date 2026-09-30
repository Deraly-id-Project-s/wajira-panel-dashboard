import type { VehicleEquipment, VehicleEquipmentListResponse, VehicleEquipmentPayload } from '@/@types/vehicle-equipment.types';
import type { PaginationParams } from '@/@types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, LaravelApiResponse, ensureSuccess, toPaginatedResult, ApiValidationError } from '@/lib/api/response';

const basePath = '/wapi/master-data/vehicle-equipment';

export const getVehicleEquipments = async (params: PaginationParams & { search?: string }): Promise<VehicleEquipmentListResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
    },
  });

  const data = ensureSuccess(response.data);

  return toPaginatedResult(
    {
      data: data.data ?? [],
      current_page: data.current_page,
      per_page: data.per_page,
      total: data.total,
      last_page: data.last_page,
    },
    (item: any) => ({
      id: item.id,
      uuid: item.uuid,
      code: item.code || '',
      name: item.name || '',
      description: item.description || '',
      buy_price: item.buy_price !== undefined && item.buy_price !== null ? Number(item.buy_price) : 0,
      sell_price: item.sell_price !== undefined && item.sell_price !== null ? Number(item.sell_price) : 0,
      buyPrice: item.buy_price !== undefined && item.buy_price !== null ? Number(item.buy_price) : 0,
      sellPrice: item.sell_price !== undefined && item.sell_price !== null ? Number(item.sell_price) : 0,
      available_stock: item.available_stock !== undefined && item.available_stock !== null ? Number(item.available_stock) : 0,
      availableStock: item.available_stock !== undefined && item.available_stock !== null ? Number(item.available_stock) : 0,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }),
  );
};

export const getVehicleEquipmentById = async (id: string | number): Promise<VehicleEquipment> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`);
  const data = ensureSuccess(response.data);

  return {
    id: data.id,
    uuid: data.uuid,
    code: data.code || '',
    name: data.name || '',
    description: data.description || '',
    buy_price: data.buy_price !== undefined && data.buy_price !== null ? Number(data.buy_price) : 0,
    sell_price: data.sell_price !== undefined && data.sell_price !== null ? Number(data.sell_price) : 0,
    buyPrice: data.buy_price !== undefined && data.buy_price !== null ? Number(data.buy_price) : 0,
    sellPrice: data.sell_price !== undefined && data.sell_price !== null ? Number(data.sell_price) : 0,
    available_stock: data.available_stock !== undefined && data.available_stock !== null ? Number(data.available_stock) : 0,
    availableStock: data.available_stock !== undefined && data.available_stock !== null ? Number(data.available_stock) : 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
};

export const createVehicleEquipment = async (data: Partial<VehicleEquipmentPayload>): Promise<VehicleEquipment> => {
  const formData = new FormData();
  if (data.code) formData.append('code', data.code);
  if (data.name) formData.append('name', data.name);
  if (data.description !== undefined && data.description !== null) formData.append('description', data.description);
  if (data.buy_price !== undefined && data.buy_price !== null) formData.append('buy_price', String(data.buy_price));
  if (data.sell_price !== undefined && data.sell_price !== null) formData.append('sell_price', String(data.sell_price));

  try {
    const response = await apiClient.post<LaravelApiResponse<any>>(basePath, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const payload = response.data;
    if (!payload.status) {
      throw new ApiResponseError(payload.message ?? 'Failed to create vehicle equipment');
    }

    return payload.data;
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateVehicleEquipment = async (id: string | number, data: Partial<VehicleEquipmentPayload>): Promise<VehicleEquipment> => {
  const formData = new FormData();
  formData.append('_method', 'PUT');
  if (data.code) formData.append('code', data.code);
  if (data.name) formData.append('name', data.name);
  if (data.description !== undefined && data.description !== null) formData.append('description', data.description);
  if (data.buy_price !== undefined && data.buy_price !== null) formData.append('buy_price', String(data.buy_price));
  if (data.sell_price !== undefined && data.sell_price !== null) formData.append('sell_price', String(data.sell_price));

  try {
    const response = await apiClient.post<LaravelApiResponse<any>>(`${basePath}/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const payload = response.data;
    if (!payload.status) {
      throw new ApiResponseError(payload.message ?? 'Failed to update vehicle equipment');
    }

    return payload.data;
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteVehicleEquipment = async (id: string | number): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<any>>(`${basePath}/${id}`);

  const payload = response.data;
  if (!payload.status) {
    throw new ApiResponseError(payload.message ?? 'Failed to delete vehicle equipment');
  }
};
