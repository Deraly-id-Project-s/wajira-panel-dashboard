import type { Account, AccountDetail, AccountListResponse, AccountPayload, AccountUpdatePayload } from '@/@types/account.types';
import type { PaginationParams } from '@/@types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, ApiValidationError, LaravelApiResponse, ensureSuccess, toPaginatedResult } from '@/lib/api/response';

interface AccountApiModel {
  id: number;
  uuid?: string;
  account_group_id: number;
  account_group_name?: string;
  account_group?: {
    id: number;
    company_id?: string | number | null;
    group_code?: string;
    name: string;
  };
  code: string;
  name: string;
  description?: string | null;
  type?: 'credit' | 'debet' | 'debit';
  pos_code?: string | null;
  category?: string;
  is_active?: boolean | number;
  is_lock?: boolean | number;
  created_at?: string;
  updated_at?: string;
}

const mapAccount = (payload: AccountApiModel): Account => ({
  id: payload.id,
  uuid: payload.uuid,
  code: payload.code,
  name: payload.name,
  accountGroupId: payload.account_group_id,
  accountGroupCode: payload.account_group?.group_code ?? payload.account_group_name ?? undefined,
  group: payload.account_group?.group_code ?? payload.account_group_name ?? payload.account_group?.name,
  category: payload.category ?? undefined,
  type: payload.type === 'debit' ? 'debet' : payload.type, // normalize to debet
  pos_code: payload.pos_code ?? null,
  posCode: payload.pos_code ?? null,
  cashFlow: undefined,
  description: payload.description ?? null,
  isActive: payload.is_active === undefined ? true : payload.is_active === true || payload.is_active === 1,
  is_lock: payload.is_lock === undefined ? false : payload.is_lock === true || payload.is_lock === 1 || String(payload.is_lock) === '1' || String(payload.is_lock) === 'true',
  createdAt: payload.created_at,
  updatedAt: payload.updated_at,
  companyId: payload.account_group?.company_id ? String(payload.account_group.company_id) : undefined,
});

const basePath = '/wapi/master-data/account';

type PaginatedAccountResponse = LaravelApiResponse<{
  data: AccountApiModel[];
  current_page: number;
  per_page?: number;
  perPage?: number;
  total: number;
  last_page: number;
}>;

type AccountItemResponse = LaravelApiResponse<AccountApiModel>;

type DeleteResponse = LaravelApiResponse<null>;

export const getAccounts = async (params: PaginationParams & { search?: string; company_id?: string | number; type?: string; account_group_id?: string | number }): Promise<AccountListResponse> => {
  const response = await apiClient.get<PaginatedAccountResponse>(basePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
      company_id: params.company_id,
      type: params.type,
      account_group_id: params.account_group_id && params.account_group_id !== 'all' ? params.account_group_id : undefined,
    },
  });

  const data = ensureSuccess(response.data);
  let scopedData = params.company_id
    ? (data.data ?? []).filter((item) => String(item.account_group?.company_id) === String(params.company_id))
    : (data.data ?? []);

  if (params.account_group_id && params.account_group_id !== 'all') {
    scopedData = scopedData.filter((item) => String(item.account_group_id) === String(params.account_group_id));
  }

  const isFrontendFallback = params.company_id || (params.account_group_id && params.account_group_id !== 'all')
    ? (scopedData.length !== (data.data ?? []).length)
    : false;

  return toPaginatedResult(
    {
      data: scopedData,
      current_page: data.current_page,
      per_page: data.per_page ?? data.perPage ?? params.perPage ?? 10,
      total: isFrontendFallback ? scopedData.length : data.total,
      last_page: isFrontendFallback ? Math.max(1, Math.ceil(scopedData.length / Math.max(data.per_page ?? data.perPage ?? params.perPage ?? 1, 1))) : data.last_page,
    },
    mapAccount,
  );
};

export const getAccountById = async (id: number | string): Promise<AccountDetail> => {
  const response = await apiClient.get<AccountItemResponse>(`${basePath}/${id}`);
  const data = ensureSuccess(response.data);
  return mapAccount(data);
};

export const createAccount = async (payload: AccountPayload): Promise<Account> => {
  try {
    const type = payload.type === 'debit' ? 'debet' : (payload.type ?? 'debet');
    const posCode = payload.pos_code ?? payload.posCode;
    const body = new FormData();
    body.append('account_group_id', String(payload.accountGroupId));
    body.append('code', payload.code);
    body.append('name', payload.name);
    if (payload.description !== undefined && payload.description !== null) body.append('description', payload.description);
    body.append('type', type);
    if (posCode !== undefined && posCode !== null && posCode !== '') body.append('pos_code', posCode);
    if (payload.category) body.append('category', payload.category);
    if (payload.is_lock !== undefined) body.append('is_lock', payload.is_lock ? '1' : '0');

    const response = await apiClient.post<AccountItemResponse>(basePath, body);

    const data = ensureSuccess(response.data);
    return mapAccount(data);
  } catch (error) {
    if (error instanceof ApiValidationError) {
      throw error;
    }
    throw error;
  }
};

export const updateAccount = async (id: number | string, payload: AccountUpdatePayload): Promise<Account> => {
  try {
    const type = payload.type === 'debit' ? 'debet' : (payload.type ?? 'debet');
    const posCode = payload.pos_code !== undefined ? payload.pos_code : payload.posCode;

    const body = new URLSearchParams();
    if (payload.accountGroupId !== undefined) body.append('account_group_id', String(payload.accountGroupId));
    if (payload.code !== undefined) body.append('code', payload.code);
    if (payload.name !== undefined) body.append('name', payload.name);
    if (payload.description !== undefined && payload.description !== null) body.append('description', payload.description);
    if (payload.type !== undefined) body.append('type', type);
    if (posCode !== undefined) body.append('pos_code', posCode ?? '');
    if (payload.category !== undefined && payload.category !== null) body.append('category', payload.category);
    if (payload.is_lock !== undefined) body.append('is_lock', payload.is_lock ? '1' : '0');

    const response = await apiClient.put<AccountItemResponse>(`${basePath}/${id}`, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const data = ensureSuccess(response.data);
    return mapAccount(data);
  } catch (error) {
    if (error instanceof ApiValidationError) {
      throw error;
    }
    throw error;
  }
};

export const deleteAccount = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<DeleteResponse>(`${basePath}/${id}`);
  const payload = response.data;

  if (!payload.status) {
    throw new ApiResponseError(payload.message ?? 'Failed to delete account');
  }
};

// Legacy helper retained for compatibility with older dropdowns that require a flat list
export const getAccountHierarchy = async (): Promise<Account[]> => {
  const { data } = await getAccounts({ page: 1, perPage: 1000 });
  return data;
};

export const importAccount = async (file: File, companyId?: string | number): Promise<void> => {
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
    throw new ApiResponseError(payload.message ?? 'Failed to import account');
  }
};

export const bulkUpdateAccounts = async (payload: {
  accountIds: (number | string)[];
  accountGroupId: number;
  category: string;
}): Promise<void> => {
  try {
    const body = new URLSearchParams();
    payload.accountIds.forEach((id) => {
      body.append('account_id[]', String(id));
    });
    body.append('account_group_id', String(payload.accountGroupId));
    body.append('category', payload.category);

    const response = await apiClient.put<LaravelApiResponse<null>>(`${basePath}/bulk-update`, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const data = response.data;
    if (!data.status) {
      throw new ApiResponseError(data.message ?? 'Gagal memperbarui akun terpilih secara massal');
    }
  } catch (error) {
    if (error instanceof ApiValidationError) {
      throw error;
    }
    throw error;
  }
};
