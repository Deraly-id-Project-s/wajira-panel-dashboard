import { apiClient } from '@/lib/api/client';
import { ApiResponse } from './tax.service';
import { WarehouseSubBlock } from './warehouseBlock.service';

export interface CreateUpdateWarehouseSubBlockDTO {
  warehouse_block_id: number;
  name: string;
  description: string;
  is_active: boolean;
  is_default: boolean;
}

export const createWarehouseSubBlock = async (data: CreateUpdateWarehouseSubBlockDTO) => {
  const formData = new URLSearchParams();
  formData.append('warehouse_block_id', String(data.warehouse_block_id));
  formData.append('name', data.name);
  formData.append('description', data.description);
  const isActive = String(data.is_active) === '1' || String(data.is_active) === 'true' || data.is_active === true;
  const isDefault = String(data.is_default) === '1' || String(data.is_default) === 'true' || data.is_default === true;
  formData.append('is_active', isActive ? 'true' : 'false');
  formData.append('is_default', isDefault ? 'true' : 'false');

  const response = await apiClient.post<ApiResponse<WarehouseSubBlock>>(`/wapi/master-data/warehouse-sub-block`, formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data;
};

export const updateWarehouseSubBlock = async (id: number, data: CreateUpdateWarehouseSubBlockDTO) => {
  const formData = new URLSearchParams();
  formData.append('warehouse_block_id', String(data.warehouse_block_id));
  formData.append('name', data.name);
  formData.append('description', data.description);
  const isActive = String(data.is_active) === '1' || String(data.is_active) === 'true' || data.is_active === true;
  const isDefault = String(data.is_default) === '1' || String(data.is_default) === 'true' || data.is_default === true;
  formData.append('is_active', isActive ? 'true' : 'false');
  formData.append('is_default', isDefault ? 'true' : 'false');
  formData.append('_method', 'PUT');

  const response = await apiClient.post<ApiResponse<WarehouseSubBlock>>(`/wapi/master-data/warehouse-sub-block/${id}`, formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data;
};

export const makeDefaultWarehouseSubBlock = async (id: number, data: CreateUpdateWarehouseSubBlockDTO) => {
  const formData = new URLSearchParams();
  formData.append('warehouse_block_id', String(data.warehouse_block_id));
  formData.append('name', data.name);
  formData.append('description', data.description);
  const isActive = String(data.is_active) === '1' || String(data.is_active) === 'true' || data.is_active === true;
  const isDefault = String(data.is_default) === '1' || String(data.is_default) === 'true' || data.is_default === true;
  formData.append('is_active', isActive ? 'true' : 'false');
  formData.append('is_default', isDefault ? 'true' : 'false');
  formData.append('_method', 'PUT');

  const response = await apiClient.post<ApiResponse<WarehouseSubBlock>>(`/wapi/master-data/warehouse-sub-block/${id}/make-default`, formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data;
};

export const assignSubBlock = async (id: number, unitTransactionItemDetailsIds: number[]) => {
  const formData = new URLSearchParams();
  formData.append('unit_transaction_item_details_ids', JSON.stringify(unitTransactionItemDetailsIds));
  formData.append('_method', 'PUT');

  const response = await apiClient.post<ApiResponse<WarehouseSubBlock>>(`/wapi/master-data/warehouse-sub-block/${id}/assign-sub-block`, formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data;
};

export const deleteWarehouseSubBlock = async (id: number) => {
  const response = await apiClient.delete<ApiResponse<any>>(`/wapi/master-data/warehouse-sub-block/${id}`);
  return response.data;
};

export interface WarehouseSubBlockParams {
  is_active?: boolean;
  per_page?: number;
  page?: number;
  search?: string;
  company_id?: string | number;
}

export const getWarehouseSubBlocks = async (params: WarehouseSubBlockParams = {}) => {
  const response = await apiClient.get<ApiResponse<any>>(`/wapi/master-data/warehouse-sub-block`, {
    params,
  });
  return response.data;
};

export const exportWarehouseSubBlock = async () => {
  const response = await apiClient.get(`/wapi/master-data/warehouse-sub-block/export`, {
    responseType: 'blob',
  });
  return response.data;
};

export const importWarehouseSubBlock = async (file: File) => {
  const form = new FormData();
  form.append('file', file);
  const response = await apiClient.post<ApiResponse<any>>(`/wapi/master-data/warehouse-sub-block/import`, form);
  return response.data;
};
