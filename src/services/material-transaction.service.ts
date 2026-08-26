import type {
  MaterialTransaction,
  MaterialTransactionBilling,
  MaterialTransactionBillingListResponse,
  MaterialTransactionBillingPayload,
  MaterialTransactionDetail,
  MaterialTransactionDetailItem,
  MaterialTransactionItemListResponse,
  MaterialTransactionItemPayload,
  MaterialTransactionListResponse,
  MaterialTransactionPayload,
  MaterialTransactionType,
} from '@/types/material-transaction.types';
import type { PaginationParams } from '@/types/pagination.types';
import type { WarehouseOption } from '@/types/pengeluaran-unit.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, ApiValidationError, type LaravelApiResponse, ensureSuccess, toPaginatedResult } from '@/lib/api/response';

interface MaterialApiModel {
  id: number;
  uuid?: string;
  code?: string;
  name?: string;
  price?: number | string;
  type?: string;
  created_at?: string;
  updated_at?: string;
}

interface CashApiModel {
  id: number;
  uuid?: string;
  company_id?: number | string | null;
  code: string;
  description: string;
  type: 'cash' | 'bank';
  amount?: number | string;
  created_at?: string;
  updated_at?: string;
}

interface MaterialTransactionApiModel {
  id: number;
  uuid?: string;
  code: string;
  type: MaterialTransactionType;
  warehouse_id?: number | string;
  warehouse?: {
    id?: number | string;
    name?: string;
  } | null;
  stock_state?: string;
  supplier_name: string;
  is_paid: boolean | number;
  transaction_date: string;
  description?: string | null;
  created_at?: string;
  total_amount?: number | string;
  total_paid?: number | string;
  total_unpaid?: number | string;
}

interface MaterialTransactionDetailApiModel {
  id: number;
  uuid?: string;
  order_code?: string;
  material_transaction_id: number;
  material_id: number;
  qty: number | string;
  price: number | string;
  total?: number | string;
  in_stock?: boolean | number;
  is_forecast?: boolean | number;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  material_transaction?: MaterialTransactionApiModel;
  material?: MaterialApiModel;
}

interface MaterialTransactionBillingApiModel {
  id: number;
  uuid?: string;
  material_transaction_id: number;
  cash_id: number;
  amount: number | string;
  payment_date?: string | null;
  description?: string | null;
  created_at?: string;
  material_transaction?: MaterialTransactionApiModel;
  cash?: CashApiModel;
}

interface MaterialTransactionDetailResponseApiModel extends MaterialTransactionApiModel {
  material_transaction_details?: MaterialTransactionDetailApiModel[];
  material_transaction_billings?: MaterialTransactionBillingApiModel[];
}

type PaginationApiResponse<T> = LaravelApiResponse<{
  data: T[];
  current_page: number;
  per_page?: number;
  perPage?: number;
  total: number;
  last_page: number;
}>;

type ItemApiResponse<T> = LaravelApiResponse<T>;
type DeleteApiResponse = LaravelApiResponse<null>;

const transactionBasePath = '/wapi/transaction/material-transaction';
const detailBasePath = '/wapi/transaction/material-transaction-detail';
const billingBasePath = '/wapi/transaction/material-transaction-billing';

const toNumber = (value: string | number | undefined | null) => Number(value ?? 0) || 0;
const toBoolean = (value: boolean | number | undefined | null) => value === true || value === 1;
const mapWarehouseOption = (payload?: { id?: number | string; name?: string } | null): WarehouseOption | null =>
  payload?.id
    ? {
        id: toNumber(payload.id),
        name: payload.name ?? `Warehouse #${payload.id}`,
      }
    : null;

const mapTransaction = (payload: MaterialTransactionApiModel): MaterialTransaction => ({
  id: payload.id,
  uuid: payload.uuid,
  code: payload.code,
  type: payload.type,
  warehouseId: toNumber(payload.warehouse_id),
  warehouse: mapWarehouseOption(payload.warehouse),
  stockState: payload.stock_state,
  supplierName: payload.supplier_name,
  isPaid: toBoolean(payload.is_paid),
  transactionDate: payload.transaction_date,
  description: payload.description ?? null,
  createdAt: payload.created_at,
  totalAmount: toNumber(payload.total_amount),
  totalPaid: toNumber(payload.total_paid),
  totalUnpaid: toNumber(payload.total_unpaid),
});

const mapTransactionItem = (payload: MaterialTransactionDetailApiModel): MaterialTransactionDetailItem => ({
  id: payload.id,
  uuid: payload.uuid,
  orderCode: payload.order_code,
  materialTransactionId: payload.material_transaction_id,
  materialId: payload.material_id,
  qty: toNumber(payload.qty),
  price: toNumber(payload.price),
  total: toNumber(payload.total),
  inStock: toBoolean(payload.in_stock),
  isForecast: toBoolean(payload.is_forecast),
  description: payload.description ?? null,
  createdAt: payload.created_at,
  updatedAt: payload.updated_at,
  material: payload.material
    ? {
        id: payload.material.id,
        uuid: payload.material.uuid ?? '',
        code: payload.material.code ?? '',
        name: payload.material.name ?? '',
        price: toNumber(payload.material.price),
        type: payload.material.type ?? '',
        createdAt: payload.material.created_at,
        updatedAt: payload.material.updated_at,
      }
    : undefined,
});

const mapBilling = (payload: MaterialTransactionBillingApiModel): MaterialTransactionBilling => ({
  id: payload.id,
  uuid: payload.uuid,
  materialTransactionId: payload.material_transaction_id,
  cashId: payload.cash_id,
  amount: toNumber(payload.amount),
  paymentDate: payload.payment_date ?? null,
  description: payload.description ?? null,
  createdAt: payload.created_at,
  materialTransaction: payload.material_transaction ? mapTransaction(payload.material_transaction) : undefined,
  cash: payload.cash
    ? {
        id: payload.cash.id,
        uuid: payload.cash.uuid,
        code: payload.cash.code,
        description: payload.cash.description,
        type: payload.cash.type,
        amount: payload.cash.amount ?? 0,
        companyId: payload.cash.company_id ?? null,
        createdAt: payload.cash.created_at,
        updatedAt: payload.cash.updated_at,
      }
    : undefined,
});

const normalizePagination = <T>(payload: {
  data?: T[];
  current_page: number;
  per_page?: number;
  perPage?: number;
  total: number;
  last_page: number;
}) => ({
  data: payload.data ?? [],
  current_page: payload.current_page,
  per_page: payload.per_page ?? payload.perPage ?? 10,
  total: payload.total,
  last_page: payload.last_page,
});

export const getMaterialTransactions = async (
  params: PaginationParams & { search?: string; type?: MaterialTransactionType; supplier_name?: string; code?: string },
): Promise<MaterialTransactionListResponse> => {
  const response = await apiClient.get<PaginationApiResponse<MaterialTransactionApiModel>>(transactionBasePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
      type: params.type ?? 'purchase',
      supplier_name: params.supplier_name,
      code: params.code,
    },
  });

  const data = ensureSuccess(response.data);
  return toPaginatedResult(normalizePagination(data), mapTransaction);
};

export const getMaterialTransactionById = async (id: number | string): Promise<MaterialTransactionDetail> => {
  const response = await apiClient.get<ItemApiResponse<MaterialTransactionDetailResponseApiModel>>(`${transactionBasePath}/${id}`);
  const data = ensureSuccess(response.data);

  return {
    ...mapTransaction(data),
    materialTransactionDetails: (data.material_transaction_details ?? []).map(mapTransactionItem),
    materialTransactionBillings: (data.material_transaction_billings ?? []).map(mapBilling),
  };
};

export const createMaterialTransaction = async (payload: MaterialTransactionPayload): Promise<MaterialTransaction> => {
  try {
    const body = new FormData();
    body.append('type', payload.type);
    body.append('warehouse_id', String(payload.warehouseId));
    body.append('supplier_name', payload.supplierName);
    body.append('transaction_date', payload.transactionDate);
    if (payload.description) body.append('description', payload.description);

    const response = await apiClient.post<ItemApiResponse<MaterialTransactionApiModel>>(transactionBasePath, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return mapTransaction(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateMaterialTransaction = async (id: number | string, payload: Omit<MaterialTransactionPayload, 'type'>): Promise<MaterialTransaction> => {
  try {
    const body = new FormData();
    body.append('warehouse_id', String(payload.warehouseId));
    body.append('supplier_name', payload.supplierName);
    body.append('transaction_date', payload.transactionDate);
    if (payload.description) body.append('description', payload.description);

    const response = await apiClient.put<ItemApiResponse<MaterialTransactionApiModel>>(`${transactionBasePath}/${id}`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return mapTransaction(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteMaterialTransaction = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<DeleteApiResponse>(`${transactionBasePath}/${id}`);
  if (!response.data.status) throw new ApiResponseError(response.data.message ?? 'Failed to delete material transaction');
};

export const getMaterialTransactionItems = async (
  params: PaginationParams & {
    search?: string;
    type?: MaterialTransactionType;
    materialTransactionId?: number | string;
    materialId?: number | string;
    inStock?: boolean;
    isForecast?: boolean;
  },
): Promise<MaterialTransactionItemListResponse> => {
  const response = await apiClient.get<PaginationApiResponse<MaterialTransactionDetailApiModel>>(detailBasePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
      type: params.type ?? 'purchase',
      material_transaction_id: params.materialTransactionId,
      material_id: params.materialId,
      in_stock: typeof params.inStock === 'boolean' ? params.inStock : undefined,
      is_forecast: typeof params.isForecast === 'boolean' ? params.isForecast : undefined,
    },
  });

  const data = ensureSuccess(response.data);
  return toPaginatedResult(normalizePagination(data), mapTransactionItem);
};

export const getMaterialTransactionItemById = async (id: number | string): Promise<MaterialTransactionDetailItem> => {
  const response = await apiClient.get<ItemApiResponse<MaterialTransactionDetailApiModel>>(`${detailBasePath}/${id}`);
  return mapTransactionItem(ensureSuccess(response.data));
};

export const createMaterialTransactionItem = async (payload: MaterialTransactionItemPayload): Promise<MaterialTransactionDetailItem> => {
  try {
    const body = new FormData();
    body.append('order_code', payload.orderCode);
    body.append('material_transaction_id', String(payload.materialTransactionId));
    body.append('material_id', String(payload.materialId));
    body.append('qty', String(payload.qty));
    body.append('price', String(payload.price));
    if (payload.description) body.append('description', payload.description);

    const response = await apiClient.post<ItemApiResponse<MaterialTransactionDetailApiModel>>(detailBasePath, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return mapTransactionItem(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateMaterialTransactionItem = async (id: number | string, payload: MaterialTransactionItemPayload): Promise<MaterialTransactionDetailItem> => {
  try {
    const body = new FormData();
    body.append('order_code', payload.orderCode);
    body.append('material_transaction_id', String(payload.materialTransactionId));
    body.append('material_id', String(payload.materialId));
    body.append('qty', String(payload.qty));
    body.append('price', String(payload.price));
    if (payload.description) body.append('description', payload.description);

    const response = await apiClient.put<ItemApiResponse<MaterialTransactionDetailApiModel>>(`${detailBasePath}/${id}`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return mapTransactionItem(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteMaterialTransactionItem = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<DeleteApiResponse>(`${detailBasePath}/${id}`);
  if (!response.data.status) throw new ApiResponseError(response.data.message ?? 'Failed to delete material transaction detail');
};

export const getMaterialTransactionBillings = async (
  params: PaginationParams & { materialTransactionId?: number | string },
): Promise<MaterialTransactionBillingListResponse> => {
  const response = await apiClient.get<PaginationApiResponse<MaterialTransactionBillingApiModel>>(billingBasePath, {
    params: buildLaravelPaginationQuery(params),
  });

  const data = ensureSuccess(response.data);
  const normalized = normalizePagination(data);
  const filtered = params.materialTransactionId
    ? normalized.data.filter((item) => String(item.material_transaction_id) === String(params.materialTransactionId))
    : normalized.data;

  return toPaginatedResult(
    {
      ...normalized,
      data: filtered,
      total: params.materialTransactionId ? filtered.length : normalized.total,
      last_page: params.materialTransactionId ? 1 : normalized.last_page,
    },
    mapBilling,
  );
};

export const createMaterialTransactionBilling = async (payload: MaterialTransactionBillingPayload): Promise<MaterialTransactionBilling> => {
  try {
    const body = new URLSearchParams();
    body.append('material_transaction_id', String(payload.materialTransactionId));
    body.append('cash_id', String(payload.cashId));
    body.append('amount', String(payload.amount));
    if (payload.paymentDate) body.append('payment_date', payload.paymentDate);
    if (payload.description) body.append('description', payload.description);

    const response = await apiClient.post<ItemApiResponse<MaterialTransactionBillingApiModel>>(billingBasePath, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return mapBilling(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const uploadMaterialTransactionInvoice = async (id: number | string, file: File): Promise<void> => {
  try {
    const body = new FormData();
    body.append('invoice_file', file);

    const response = await apiClient.post<DeleteApiResponse>(`${transactionBasePath}/${id}/upload-invoice`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    ensureSuccess(response.data);
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};
