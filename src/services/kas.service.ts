import { Kas, KasListResponse, KasPayload, KasType } from '@/types/kas.types';
import type { LaravelPagination } from '@/types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { ApiResponseError, LaravelApiResponse, ensureSuccess } from '@/lib/api/response';

interface KasApiModel {
  id: number;
  uuid?: string;
  company_id?: number | string;
  code: string;
  description: string;
  type: KasType;
  cash_name?: string;
  amount?: number | string;
  created_at?: string;
  updated_at?: string;
}

type KasListApiResponse = LaravelApiResponse<LaravelPagination<KasApiModel> | KasApiModel[]>;
type KasItemApiResponse = LaravelApiResponse<KasApiModel>;
type DeleteResponse = LaravelApiResponse<null>;

const basePath = '/wapi/master-data/cash';

const mapKas = (payload: KasApiModel): Kas => ({
  id: payload.id,
  uuid: payload.uuid,
  code: payload.code,
  cash_name: payload.cash_name,
  description: payload.description,
  type: payload.type,
  amount: payload.amount ?? 0,
  companyId: payload.company_id ?? null,
  createdAt: payload.created_at,
  updatedAt: payload.updated_at,
});

const normalizeList = (data: LaravelPagination<KasApiModel> | KasApiModel[]): { list: KasApiModel[]; meta: { current_page: number; perPage: number; total: number; last_page: number } } => {
  if (Array.isArray(data)) {
    return {
      list: data,
      meta: {
        current_page: 1,
        perPage: data.length || 1,
        total: data.length,
        last_page: 1,
      },
    };
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

const buildPayload = (payload: KasPayload, opts?: { asUpdate?: boolean }) => {
  const body = new FormData();
  if (opts?.asUpdate) body.append('_method', 'PUT');

  body.append('code', payload.code);
  body.append('description', payload.description);
  body.append('type', payload.type);
  if (payload.companyId !== undefined && payload.companyId !== null) {
    body.append('company_id', String(payload.companyId));
  }

  return body;
};

export const getKas = async (companyId?: string | number): Promise<KasListResponse> => {
  const response = await apiClient.get<KasListApiResponse>(basePath, {
    params: companyId ? { company_id: companyId } : undefined,
  });
  const data = ensureSuccess(response.data);
  const { list, meta } = normalizeList(data);

  return {
    data: list.map(mapKas),
    meta: {
      currentPage: meta.current_page,
      perPage: meta.perPage,
      total: meta.total,
      lastPage: meta.last_page,
    },
  };
};

export const createKas = async (payload: KasPayload): Promise<Kas> => {
  const body = buildPayload(payload);
  const response = await apiClient.post<KasItemApiResponse>(basePath, body);
  const data = ensureSuccess(response.data);
  return mapKas(data);
};

export const updateKas = async (id: number | string, payload: KasPayload): Promise<Kas> => {
  const body = buildPayload(payload, { asUpdate: true });
  const response = await apiClient.post<KasItemApiResponse>(`${basePath}/${id}`, body);
  const data = ensureSuccess(response.data);
  return mapKas(data);
};

export const deleteKas = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<DeleteResponse>(`${basePath}/${id}`);
  const payload = response.data;
  if (!payload.status) {
    throw new ApiResponseError(payload.message ?? 'Failed to delete kas');
  }
};

export const importKas = async (file: File, companyId?: string | number): Promise<void> => {
  const body = new FormData();
  body.append('file', file);
  if (companyId) body.append('company_id', String(companyId));

  const response = await apiClient.post(`${basePath}/import`, body, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const payload = response.data as LaravelApiResponse<null>;
  if (!payload.status) {
    throw new ApiResponseError(payload.message ?? 'Failed to import kas');
  }
};

