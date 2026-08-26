import { apiClient } from '@/lib/api/client';
import { ensureSuccess, type LaravelApiResponse } from '@/lib/api/response';
import { Permission } from '@/types/permission.types';

const basePath = '/wapi/permissions';

type PermissionResponse = LaravelApiResponse<Permission[] | Permission>;

export const getPermissions = async (): Promise<Permission[]> => {
  const response = await apiClient.get<PermissionResponse>(basePath);
  const data = ensureSuccess(response.data);
  const list = Array.isArray(data) ? data : [data];
  return list;
};

export const getPermissionById = async (id: number | string): Promise<Permission> => {
  const response = await apiClient.get<LaravelApiResponse<Permission>>(`${basePath}/${id}`);
  const data = ensureSuccess(response.data);
  return data;
};
