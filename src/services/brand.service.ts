import type { Brand, BrandDetail, BrandListResponse, BrandPayload } from '@/types/brand.types';
import type { PaginationParams } from '@/types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, ApiValidationError, LaravelApiResponse, ensureSuccess, toPaginatedResult } from '@/lib/api/response';

interface BrandApiModel {
  id: number;
  name: string;
  image?: string | null;
  created_at?: string;
  updated_at?: string;
}

const mapBrand = (payload: BrandApiModel): Brand => {
  return {
    id: payload.id,
    name: payload.name,
    image: payload.image ?? null,
    createdAt: payload.created_at,
    updatedAt: payload.updated_at,
  };
};

const basePath = '/wapi/master-data/brand';

type PaginatedBrandResponse = LaravelApiResponse<{
  data: BrandApiModel[];
  current_page: number;
  perPage: number;
  total: number;
  last_page: number;
}>;

type BrandItemResponse = LaravelApiResponse<BrandApiModel>;

export const getBrands = async (params: PaginationParams & { search?: string }): Promise<BrandListResponse> => {
  // 1. Tarik semua data dari backend tanpa limit paginasi standar
  const response = await apiClient.get<PaginatedBrandResponse>(basePath, {
    params: {
      per_page: 9999, // Fallback untuk memastikan backend selalu mereturn semua
    },
  });

  const data = ensureSuccess(response.data);
  const isDirectArray = Array.isArray(data);
  const items: BrandApiModel[] = isDirectArray ? data : ((data as any).data ?? []);

  let filteredData = items;

  // 3. Client-Side Search Matching (Cari di semua field relevan)
  if (params.search && params.search.trim() !== '') {
    const keyword = params.search.toLowerCase().trim();
    filteredData = filteredData.filter((item) => {
      const name = (item.name ?? '').toLowerCase();
      return name.includes(keyword);
    });
  }

  // 4. Client-Side Pagination (Slicing Array)
  const page = params.page ?? 1;
  const perPage = params.perPage ?? 10;
  const start = (page - 1) * perPage;
  const paginatedData = filteredData.slice(start, start + perPage);

  // 5. Kembalikan array terpotong beserta manipulasi meta pagination
  return toPaginatedResult(
    {
      data: paginatedData,
      current_page: page,
      per_page: perPage,
      total: filteredData.length,
      last_page: Math.max(1, Math.ceil(filteredData.length / perPage)),
    },
    mapBrand,
  );
};

export const getBrandById = async (id: number | string): Promise<BrandDetail> => {
  const response = await apiClient.get<BrandItemResponse>(`${basePath}/${id}`);
  const data = ensureSuccess(response.data);
  return mapBrand(data);
};

export const createBrand = async (payload: BrandPayload): Promise<Brand> => {
  try {
    const body = new FormData();
    body.append('name', payload.name);
    if (payload.image instanceof File) {
      body.append('image', payload.image);
    }

    const response = await apiClient.post<BrandItemResponse>(basePath, body);
    const data = ensureSuccess(response.data);
    return mapBrand(data);
  } catch (error) {
    if (error instanceof ApiValidationError) {
      throw error;
    }
    throw error;
  }
};

export const updateBrand = async (id: number | string, payload: BrandPayload): Promise<Brand> => {
  try {
    const body = new FormData();
    body.append('name', payload.name);
    // Method spoofing for Laravel if needed, but typically FormData + PUT needs special handling or POST + _method
    body.append('_method', 'PUT');

    if (payload.image instanceof File) {
      body.append('image', payload.image);
    }

    const response = await apiClient.post<BrandItemResponse>(`${basePath}/${id}`, body);
    const data = ensureSuccess(response.data);
    return mapBrand(data);
  } catch (error) {
    if (error instanceof ApiValidationError) {
      throw error;
    }
    throw error;
  }
};

export const deleteBrand = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${basePath}/${id}`);
  const payload = response.data;

  if (!payload.status) {
    throw new ApiResponseError(payload.message ?? 'Failed to delete brand');
  }
};
