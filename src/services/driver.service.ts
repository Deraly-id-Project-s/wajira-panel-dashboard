import type { Driver, DriverListResponse, DriverPayload } from '@/@types/driver.types';
import type { PaginationParams } from '@/@types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, ApiValidationError, LaravelApiResponse, ensureSuccess, toPaginatedResult } from '@/lib/api/response';

const basePath = '/wapi/master-data/driver';

const mapDriver = (item: any): Driver => ({
  id: item.id,
  uuid: item.uuid,
  companyId: item.company_id,
  userId: item.user_id,
  code: item.code,
  type: item.type,
  name: item.name || '',
  username: item.username ?? null,
  isActive: item.is_active,
  lastLogin: item.last_login ?? null,
  address: item.address || '',
  phone: item.phone || '',
  npwp: item.npwp || '',
  picName: item.pic_name ?? null,
  image: item.image ?? null,
  mapLink: item.map_link ?? null,
  mapCoordinat: item.map_coordinate ?? item.map_coordinat ?? null,
  identityNumber: item.identity_number || '',
  driveLicenseNumber: item.drive_license_identity_number || '',
  socialMedia1Link: item.social_media_1_link ?? null,
  socialMedia2Link: item.social_media_2_link ?? null,
  socialMedia3Link: item.social_media_3_link ?? null,
  socialMedia4Link: item.social_media_4_link ?? null,
  websiteLink: item.website_link ?? null,
  joinedAt: item.join_date ?? item.joined_at ?? null,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
  company: item.company ?? null,
});

export const getDrivers = async (
  params: PaginationParams & { search?: string; company_id?: string | number },
): Promise<DriverListResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
      company_id: params.company_id,
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
    mapDriver,
  );
};

export const getDriverById = async (id: string | number): Promise<Driver> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`);
  const data = ensureSuccess(response.data);
  return mapDriver(data);
};

const buildDriverPayload = (data: DriverPayload, opts?: { asUpdate?: boolean }) => {
  const formData = new FormData();
  if (opts?.asUpdate) formData.append('_method', 'PUT');

  formData.append('name', data.name);
  if (data.username !== undefined) formData.append('username', data.username ?? '');
  if (data.password) formData.append('password', data.password);
  if (data.is_active !== undefined) formData.append('is_active', data.is_active ? '1' : '0');
  if (data.address !== undefined) formData.append('address', data.address ?? '');
  if (data.phone !== undefined) formData.append('phone', data.phone ?? '');
  if (data.user_id !== undefined) formData.append('user_id', String(data.user_id));
  if (data.npwp !== undefined) formData.append('npwp', data.npwp ?? '');
  if (data.company_id !== undefined) formData.append('company_id', String(data.company_id));
  if (data.pic_name !== undefined) formData.append('pic_name', data.pic_name ?? '');
  if (data.identity_number !== undefined) formData.append('identity_number', data.identity_number ?? '');
  if (data.drive_license_identity_number !== undefined) formData.append('drive_license_identity_number', data.drive_license_identity_number ?? '');
  if (data.map_link !== undefined) formData.append('map_link', data.map_link ?? '');
  formData.append('map_coordinate', data.map_coordinate ?? '');
  if (data.social_media_1_link !== undefined) formData.append('social_media_1_link', data.social_media_1_link ?? '');
  if (data.social_media_2_link !== undefined) formData.append('social_media_2_link', data.social_media_2_link ?? '');
  if (data.social_media_3_link !== undefined) formData.append('social_media_3_link', data.social_media_3_link ?? '');
  if (data.social_media_4_link !== undefined) formData.append('social_media_4_link', data.social_media_4_link ?? '');
  if (data.website_link !== undefined) formData.append('website_link', data.website_link ?? '');
  if (data.join_date !== undefined) formData.append('join_date', data.join_date ?? '');
  if (data.image instanceof File) formData.append('image', data.image);

  return formData;
};

export const createDriver = async (data: DriverPayload): Promise<void> => {
  const formData = buildDriverPayload(data);

  try {
    const response = await apiClient.post<LaravelApiResponse<any>>(basePath, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const payload = response.data;
    if (!payload.status) {
      throw new ApiResponseError(payload.message ?? 'Failed to create driver');
    }
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateDriver = async (id: string | number, data: DriverPayload): Promise<void> => {
  const formData = buildDriverPayload(data, { asUpdate: true });

  try {
    const response = await apiClient.post<LaravelApiResponse<any>>(`${basePath}/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const payload = response.data;
    if (!payload.status) {
      throw new ApiResponseError(payload.message ?? 'Failed to update driver');
    }
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteDriver = async (id: string | number): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<any>>(`${basePath}/${id}`);
  const payload = response.data;
  if (!payload.status) {
    throw new ApiResponseError(payload.message ?? 'Failed to delete driver');
  }
};

export const activateDriver = async (id: string | number): Promise<void> => {
  const response = await apiClient.put<LaravelApiResponse<any>>(`${basePath}/${id}/activate-driver`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to activate driver');
  }
};

export const deactivateDriver = async (id: string | number): Promise<void> => {
  const response = await apiClient.put<LaravelApiResponse<any>>(`${basePath}/${id}/deactivate-driver`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to deactivate driver');
  }
};

export const getDriverPassword = async (id: string | number): Promise<string> => {
  const response = await apiClient.get<LaravelApiResponse<{ secure_password: string }>>(`${basePath}/${id}/get-driver-password`);
  return ensureSuccess(response.data).secure_password;
};

export const importDriver = async (id: string | number, file: File): Promise<void> => {
  const body = new FormData();
  body.append('file', file);

  const response = await apiClient.post(`${basePath}/${id}/import`, body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const payload = response.data as LaravelApiResponse<null>;
  if (!payload.status) {
    throw new ApiResponseError(payload.message ?? 'Failed to import driver data');
  }
};

export const exportDriver = async (companyId: string | number): Promise<void> => {
  const response = await apiClient.get(`${basePath}/export`, {
    params: { company_id: companyId },
    responseType: 'blob',
  });

  const contentType = response.headers['content-type'];
  const isJson = typeof contentType === 'string' && contentType.includes('application/json');

  if (isJson) {
    const textData = await (response.data as Blob).text();
    const jsonResponse = JSON.parse(textData);
    throw new ApiResponseError(jsonResponse.message ?? 'Failed to export data');
  }

  const url = window.URL.createObjectURL(new Blob([response.data as Blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Driver_${Date.now()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
