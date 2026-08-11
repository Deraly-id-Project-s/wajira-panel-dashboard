import { apiClient } from '@/lib/api/client';
import { PaginatedResponse, ApiResponse } from './tax.service';

export interface Warehouse {
  id: number;
  uuid: string;
  name: string;
}

export interface WarehouseSubBlock {
  id: number;
  uuid: string;
  warehouse_block_id: number;
  name: string;
  description: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarehouseBlock {
  id: number;
  uuid: string;
  warehouse_id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  warehouse?: Warehouse;
  warehouse_sub_blocks?: WarehouseSubBlock[];
  warehouse_sub_block_count?: number | string;
}

export const getWarehouseBlocks = async (page: number = 1, perPage: number = 25, search: string = '', companyId?: string | null) => {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<WarehouseBlock>>>(`/wapi/master-data/warehouse-block`, {
    params: { page, limit: perPage, company_id: companyId, search },
  });
  return response.data;
};

export const getWarehouseBlockDetail = async (id: number) => {
  const response = await apiClient.get<ApiResponse<WarehouseBlock>>(`/wapi/master-data/warehouse-block/${id}`);
  return response.data;
};

export interface CreateUpdateWarehouseBlockDTO {
  warehouse_id: number;
  name: string;
  description: string;
}

export const createWarehouseBlock = async (data: CreateUpdateWarehouseBlockDTO) => {
  const formData = new FormData();
  formData.append('warehouse_id', String(data.warehouse_id));
  formData.append('name', data.name);
  formData.append('description', data.description);

  const response = await apiClient.post<ApiResponse<WarehouseBlock>>(`/wapi/master-data/warehouse-block`, formData);
  return response.data;
};

export const updateWarehouseBlock = async (id: number, data: CreateUpdateWarehouseBlockDTO) => {
  const formData = new FormData();
  formData.append('warehouse_id', String(data.warehouse_id));
  formData.append('name', data.name);
  formData.append('description', data.description);
  formData.append('_method', 'PUT');

  const response = await apiClient.post<ApiResponse<WarehouseBlock>>(`/wapi/master-data/warehouse-block/${id}`, formData);
  return response.data;
};

export const deleteWarehouseBlock = async (id: number) => {
  const response = await apiClient.delete<ApiResponse<any>>(`/wapi/master-data/warehouse-block/${id}`);
  return response.data;
};

export const getWarehouseDataList = async (search: string = '') => {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<Warehouse>>>(`/wapi/warehouse/warehouse-data`, {
    params: { search, per_page: 100 },
  });
  return response.data;
};
