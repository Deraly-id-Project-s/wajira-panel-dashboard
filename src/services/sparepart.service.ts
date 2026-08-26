import type { Sparepart, SparepartCategory, SparepartListResponse, SparepartPayload } from '@/types/sparepart.types';
import { apiClient } from '@/lib/api/client';
import { ApiResponseError, LaravelApiResponse, ensureSuccess } from '@/lib/api/response';
import type { LaravelPagination } from '@/types/pagination.types';

interface SparepartApiModel {
  id: number;
  uuid?: string;
  sparepart_category_id?: number;
  code: string;
  name: string;
  unit?: string;
  unit_type?: string;
  price?: number | string;
  capacity?: number | string;
  buy_price?: number | string;
  sell_price?: number | string;
  purchase_price?: number | string;
  selling_price?: number | string;
  company_id?: number | string;
  created_at?: string;
  updated_at?: string;
  group?: string;
  sparepart_category?: SparepartCategoryApiModel | null;
}

interface SparepartCategoryApiModel {
  id: number;
  uuid?: string;
  name: string;
  code?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

type SparepartListApiResponse = LaravelApiResponse<SparepartApiModel[] | LaravelPagination<SparepartApiModel>>;
type SparepartItemApiResponse = LaravelApiResponse<SparepartApiModel>;
type SparepartCategoryListApiResponse = LaravelApiResponse<SparepartCategoryApiModel[]>;
type SparepartCategoryItemApiResponse = LaravelApiResponse<SparepartCategoryApiModel>;
type DeleteResponse = LaravelApiResponse<null>;

const sparepartBasePath = '/wapi/master-data/sparepart';
const categoryBasePath = '/wapi/master-data/sparepart-category';

export const SPAREPART_EXPORT_PATH = `${sparepartBasePath}/export`;

const mapCategory = (payload?: SparepartCategoryApiModel | null): SparepartCategory | null => {
  if (!payload) return null;
  return {
    id: payload.id,
    uuid: payload.uuid,
    name: payload.name,
    createdAt: payload.created_at,
    updatedAt: payload.updated_at,
  };
};

const mapSparepart = (payload: SparepartApiModel): Sparepart => {
  const category = mapCategory(payload.sparepart_category);
  const rawPurchase = payload.buy_price ?? payload.purchase_price;
  const rawSelling = payload.sell_price ?? payload.selling_price ?? payload.price;
  const price = payload.price ?? rawSelling ?? rawPurchase;
  const capacity = payload.capacity;

  return {
    id: payload.id,
    uuid: payload.uuid,
    code: payload.code,
    name: payload.name,
    categoryId: payload.sparepart_category_id ?? category?.id ?? null,
    unitType: payload.unit_type ?? payload.unit ?? '',
    price: price === undefined || price === null ? 0 : Number(price),
    purchasePrice: rawPurchase === undefined || rawPurchase === null ? (price ? Number(price) : 0) : Number(rawPurchase),
    sellingPrice: rawSelling === undefined || rawSelling === null ? (price ? Number(price) : 0) : Number(rawSelling),
    capacity: capacity === undefined || capacity === null ? 0 : Number(capacity),
    companyId: payload.company_id ?? null,
    createdAt: payload.created_at,
    updatedAt: payload.updated_at,
    category,
    group: payload.group ?? category?.name,
  };
};

const normalizeList = (data: SparepartApiModel[] | LaravelPagination<SparepartApiModel>): { list: SparepartApiModel[]; meta: { current_page: number; perPage: number; total: number; last_page: number } } => {
  if (Array.isArray(data)) {
    return { list: data, meta: { current_page: 1, perPage: data.length || 1, total: data.length, last_page: 1 } };
  }

  return {
    list: data.data ?? [],
    meta: {
      current_page: data.current_page ?? 1,
      perPage: data.per_page ?? (data.data?.length || 1),
      total: data.total ?? data.data?.length ?? 0,
      last_page: data.last_page ?? 1,
    },
  };
};

const buildPayload = (payload: SparepartPayload, opts?: { asUpdate?: boolean }) => {
  const body = new FormData();
  if (opts?.asUpdate) body.append('_method', 'PUT');

  body.append('code', payload.code);
  body.append('name', payload.name);
  if (payload.categoryId !== undefined && payload.categoryId !== null && Number(payload.categoryId) > 0) {
    body.append('sparepart_category_id', String(payload.categoryId));
  }
  body.append('unit_type', payload.unitType);
  const priceValue = payload.price ?? payload.sellingPrice ?? payload.purchasePrice ?? 0;
  const capacityValue = payload.capacity ?? 0;
  body.append('price', String(priceValue));
  body.append('capacity', String(capacityValue));
  if (payload.purchasePrice !== undefined) body.append('buy_price', String(payload.purchasePrice));
  if (payload.sellingPrice !== undefined) body.append('sell_price', String(payload.sellingPrice));
  if (payload.companyId) body.append('company_id', String(payload.companyId));

  return body;
};

interface SparepartCategoryPayload {
  code: string;
  name: string;
  description?: string;
}

export const getSpareparts = async (companyId?: string | number): Promise<SparepartListResponse> => {
  const response = await apiClient.get<SparepartListApiResponse>(sparepartBasePath, {
    params: companyId ? { company_id: companyId } : undefined,
  });
  const data = ensureSuccess(response.data);
  const { list, meta } = normalizeList(data);

  return {
    data: list.map(mapSparepart),
    meta: {
      currentPage: meta.current_page,
      perPage: meta.perPage,
      total: meta.total,
      lastPage: meta.last_page,
    },
  };
};

export const getSparepartCategories = async (): Promise<SparepartCategory[]> => {
  const response = await apiClient.get<SparepartCategoryListApiResponse>(categoryBasePath);
  const data = ensureSuccess(response.data);
  return data.map(mapCategory).filter(Boolean) as SparepartCategory[];
};

export const createSparepartCategory = async (payload: SparepartCategoryPayload): Promise<SparepartCategory> => {
  const body = new FormData();
  body.append('code', payload.code);
  body.append('name', payload.name);
  if (payload.description) body.append('description', payload.description);

  const response = await apiClient.post<SparepartCategoryItemApiResponse>(categoryBasePath, body);
  const data = ensureSuccess(response.data);
  return mapCategory(data) as SparepartCategory;
};

export const createSparepart = async (payload: SparepartPayload): Promise<Sparepart> => {
  const body = buildPayload(payload);
  const response = await apiClient.post<SparepartItemApiResponse>(sparepartBasePath, body);
  const data = ensureSuccess(response.data);
  return mapSparepart(data);
};

export const updateSparepart = async (id: number | string, payload: SparepartPayload): Promise<Sparepart> => {
  const body = buildPayload(payload, { asUpdate: true });
  const response = await apiClient.post<SparepartItemApiResponse>(`${sparepartBasePath}/${id}`, body);
  const data = ensureSuccess(response.data);
  return mapSparepart(data);
};

export const deleteSparepart = async (id: number | string, companyId?: string | number): Promise<void> => {
  const response = await apiClient.delete<DeleteResponse>(`${sparepartBasePath}/${id}`, {
    params: companyId ? { company_id: companyId } : undefined,
  });
  const payload = response.data;
  if (!payload.status) {
    throw new ApiResponseError(payload.message ?? 'Failed to delete sparepart');
  }
};

export const importSparepart = async (file: File, companyId?: string | number): Promise<void> => {
  const body = new FormData();
  body.append('file', file);
  if (companyId) body.append('company_id', String(companyId));

  const response = await apiClient.post<DeleteResponse>(`${sparepartBasePath}/import`, body);
  const payload = response.data;
  if (!payload.status) {
    throw new ApiResponseError(payload.message ?? 'Failed to import sparepart');
  }
};
