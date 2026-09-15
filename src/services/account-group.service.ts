import type { AccountGroup, AccountGroupDetail, AccountGroupListResponse, AccountGroupPayload, AccountGroupUpdatePayload } from '@/@types/account-group.types';
import type { PaginationParams } from '@/@types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, ApiValidationError, LaravelApiResponse, ensureSuccess, toPaginatedResult } from '@/lib/api/response';

interface AccountGroupApiModel {
  id: number;
  company_id?: string | number | null;
  uuid?: string;
  group_code?: string;
  code?: string;
  name?: string;
  description?: string | null;
  is_active?: boolean | number;
  is_lock?: boolean | number;
  created_at?: string;
  updated_at?: string;
}

// API may return `group_code` + `description` (no `name`). We fallback to keep dropdown non-empty.
const mapAccountGroup = (payload: AccountGroupApiModel): AccountGroup => {
  const code = payload.group_code ?? payload.code ?? '';
  const name = payload.name ?? payload.description ?? code;

  return {
    id: payload.id,
    code,
    name,
    companyId: payload.company_id ?? null,
    description: payload.description ?? null,
    isActive: payload.is_active === undefined ? true : payload.is_active === true || payload.is_active === 1,
    is_lock: payload.is_lock === undefined ? false : payload.is_lock === true || payload.is_lock === 1 || String(payload.is_lock) === '1' || String(payload.is_lock) === 'true',
    createdAt: payload.created_at,
    updatedAt: payload.updated_at,
  };
};

const basePath = '/wapi/master-data/account-group';

type PaginatedAccountGroupResponse = LaravelApiResponse<{
  data: AccountGroupApiModel[];
  current_page: number;
  per_page?: number;
  perPage?: number;
  total: number;
  last_page: number;
} | AccountGroupApiModel[]>;

type AccountGroupItemResponse = LaravelApiResponse<AccountGroupApiModel>;

type DeleteResponse = LaravelApiResponse<null>;

export const getAccountGroups = async (params: PaginationParams & { company_id?: string | number }): Promise<AccountGroupListResponse> => {
  // We fetch without pagination parameters so the backend returns all data,
  // allowing us to perform robust client-side search and pagination.
  const response = await apiClient.get<PaginatedAccountGroupResponse>(basePath, {
    params: {
      company_id: params.company_id,
      per_page: 9999, // Fallback if backend strictly requires it to return large sets
    },
  });

  const data = ensureSuccess(response.data);
  const isDirectArray = Array.isArray(data);
  const items: AccountGroupApiModel[] = isDirectArray ? data : ((data as any).data ?? []);

  const scopedData = params.company_id
    ? items.filter((item) => {
        if (item.company_id === undefined || item.company_id === null) return true;
        return String(item.company_id) === String(params.company_id);
      })
    : items;

  let filteredData = scopedData;
  if (params.search && params.search.trim() !== '') {
    const keyword = params.search.toLowerCase().trim();
    filteredData = filteredData.filter((item) => {
      const code = (item.group_code ?? item.code ?? '').toLowerCase();
      const name = (item.name ?? item.description ?? '').toLowerCase();
      return code.includes(keyword) || name.includes(keyword);
    });
  }

  // Always perform client-side pagination because we fetched per_page: 9999
  const page = params.page ?? 1;
  const perPage = params.perPage ?? 10;
  const start = (page - 1) * perPage;
  const paginatedData = filteredData.slice(start, start + perPage);

  return toPaginatedResult(
    {
      data: paginatedData,
      current_page: page,
      per_page: perPage,
      total: filteredData.length,
      last_page: Math.max(1, Math.ceil(filteredData.length / perPage)),
    },
    mapAccountGroup,
  );
};

export const getAccountGroupById = async (id: number | string): Promise<AccountGroupDetail> => {
  const response = await apiClient.get<AccountGroupItemResponse>(`${basePath}/${id}`);
  const data = ensureSuccess(response.data);
  return mapAccountGroup(data);
};

export const createAccountGroup = async (payload: AccountGroupPayload): Promise<AccountGroup> => {
  try {
    const body: AccountGroupPayload = {
      company_id: payload.company_id,
      group_code: payload.group_code,
      description: payload.description,
    };
    if (payload.is_lock !== undefined) body.is_lock = payload.is_lock;

    const response = await apiClient.post<AccountGroupItemResponse>(basePath, body);

    const data = ensureSuccess(response.data);
    return mapAccountGroup(data);
  } catch (error) {
    if (error instanceof ApiValidationError) {
      throw error;
    }
    throw error;
  }
};

/** Quick create used from modal (uses FormData + group_code/company_id as required by backend) */
export interface QuickCreateAccountGroupPayload {
  companyId: string | number;
  groupCode: string;
  description?: string | null;
}

export const quickCreateAccountGroup = async (payload: QuickCreateAccountGroupPayload): Promise<AccountGroup> => {
  const body = new FormData();
  body.append('company_id', String(payload.companyId));
  body.append('group_code', payload.groupCode);
  if (payload.description) body.append('description', payload.description);

  const response = await apiClient.post<AccountGroupItemResponse>(basePath, body);
  const data = ensureSuccess(response.data);
  return mapAccountGroup(data);
};

export const updateAccountGroup = async (id: number | string, payload: AccountGroupUpdatePayload): Promise<AccountGroup> => {
  try {
    const body: AccountGroupUpdatePayload = {
      company_id: payload.company_id,
    };
    if (payload.group_code !== undefined) body.group_code = payload.group_code;
    if (payload.description !== undefined) body.description = payload.description;
    if (payload.is_lock !== undefined) body.is_lock = payload.is_lock;

    const response = await apiClient.put<AccountGroupItemResponse>(`${basePath}/${id}`, body);

    const data = ensureSuccess(response.data);
    return mapAccountGroup(data);
  } catch (error) {
    if (error instanceof ApiValidationError) {
      throw error;
    }
    throw error;
  }
};

export const deleteAccountGroup = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<DeleteResponse>(`${basePath}/${id}`);
  const payload = response.data;

  if (!payload.status) {
    throw new ApiResponseError(payload.message ?? 'Failed to delete account group');
  }
};

export const importAccountGroup = async (file: File, companyId?: string | number): Promise<void> => {
  const body = new FormData();
  body.append('file', file);

  const url = companyId ? `${basePath}/${companyId}/import` : `${basePath}/import`;

  const response = await apiClient.post(url, body, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const payload = response.data as LaravelApiResponse<null>;
  if (!payload.status) {
    throw new ApiResponseError(payload.message ?? 'Failed to import account group');
  }
};
