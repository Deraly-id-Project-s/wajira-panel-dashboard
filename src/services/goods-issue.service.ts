import type {
  GoodsIssue,
  GoodsIssueBilling,
  GoodsIssueBillingPayload,
  GoodsIssueDetail,
  GoodsIssueItem,
  GoodsIssueItemPayload,
  GoodsIssueListResponse,
  GoodsIssuePayload,
  GoodsIssuePayment,
  GoodsIssuePaymentPayload,
  GoodsIssueUploadInvoicePayload,
} from '@/types/goods-issue.types';
import type { PaginationParams } from '@/types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, ApiValidationError, type LaravelApiResponse, ensureSuccess, toPaginatedResult } from '@/lib/api/response';

interface CustomerApiModel {
  id: number | string;
  uuid?: string;
  code?: string;
  type?: string;
  name?: string;
  address?: string | null;
  npwp?: string | null;
  phone?: string | null;
  pic?: string | null;
  pic_name?: string | null;
  user_id?: number | string;
  company_id?: number | string;
  created_at?: string;
  updated_at?: string;
  map_link?: string | null;
}

interface MaterialApiModel {
  id: number | string;
  uuid?: string;
  code?: string;
  name?: string;
  price?: number | string;
  type?: string;
  average_price?: number | string;
  stock?: number | string;
  total_purchased?: number | string;
  total_sold?: number | string;
  created_at?: string;
  updated_at?: string;
}

interface CashApiModel {
  id: number | string;
  uuid?: string;
  company_id?: number | string | null;
  code?: string;
  description?: string;
  type?: 'cash' | 'bank';
  amount?: number | string;
  created_at?: string;
  updated_at?: string;
}

interface GoodsIssuePaymentApiModel {
  id: number;
  uuid?: string;
  goods_transaction_billing_id: number | string;
  cash_id: number | string;
  amount: number | string;
  transaction_date?: string | null;
  description?: string | null;
  created_at?: string;
  cash?: CashApiModel | null;
}

interface GoodsIssueBillingApiModel {
  id: number;
  uuid?: string;
  goods_transaction_id: number | string;
  is_paid?: boolean | number;
  grand_total?: number | string;
  created_at?: string;
  payments?: GoodsIssuePaymentApiModel[] | null;
}

interface GoodsIssueItemApiModel {
  id: number;
  uuid?: string;
  goods_transaction_id: number | string;
  material_id: number | string;
  qty: number | string;
  type: 'pcs' | 'set' | 'box';
  price: number | string;
  total?: number | string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  material?: MaterialApiModel | null;
}

interface GoodsIssueApiModel {
  id: number;
  uuid?: string;
  code: string;
  company_id: number | string;
  customer_id?: number | string | null;
  type: 'issue';
  transaction_date: string;
  location?: string | null;
  description?: string | null;
  invoice_file?: string | null;
  created_at?: string;
  total_brutto?: number | string;
  is_paid?: boolean | number;
  billing_status?: {
    is_paid?: boolean | number;
  } | null;
  customer?: CustomerApiModel | null;
  goods_transaction_details?: GoodsIssueItemApiModel[] | null;
  goods_transaction_billings?: GoodsIssueBillingApiModel | GoodsIssueBillingApiModel[] | null;
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

const basePath = '/wapi/transaction/goods-transaction';
const detailBasePath = '/wapi/transaction/goods-transaction-detail';
const billingBasePath = '/wapi/transaction/goods-transaction-billing';
const paymentBasePath = '/wapi/transaction/goods-transaction-billing-payment';

const toNumber = (value: string | number | undefined | null) => Number(value ?? 0) || 0;
const toBoolean = (value: boolean | number | undefined | null) => value === true || value === 1;
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

const mapCustomer = (payload?: CustomerApiModel | null) =>
  payload
    ? {
        id: payload.id,
        uuid: payload.uuid,
        code: payload.code,
        type: payload.type,
        name: payload.name ?? '',
        address: payload.address ?? null,
        npwp: payload.npwp ?? null,
        phone: payload.phone ?? null,
        pic: payload.pic ?? payload.pic_name ?? null,
        userId: payload.user_id,
        companyId: payload.company_id,
        createdAt: payload.created_at,
        updatedAt: payload.updated_at,
        map_link: payload.map_link ?? null,
      }
    : undefined;

const mapMaterial = (payload?: MaterialApiModel | null) =>
  payload
    ? {
        id: toNumber(payload.id),
        uuid: payload.uuid ?? '',
        code: payload.code ?? '',
        name: payload.name ?? '',
        price: toNumber(payload.price),
        type: payload.type ?? '',
        averagePrice: toNumber(payload.average_price),
        stock: toNumber(payload.stock),
        totalPurchased: toNumber(payload.total_purchased),
        totalSold: toNumber(payload.total_sold),
        createdAt: payload.created_at,
        updatedAt: payload.updated_at,
      }
    : undefined;

const mapCash = (payload?: CashApiModel | null) =>
  payload
    ? {
        id: payload.id,
        uuid: payload.uuid,
        code: payload.code ?? '',
        description: payload.description ?? '',
        type: payload.type ?? 'cash',
        amount: payload.amount ?? 0,
        companyId: payload.company_id ?? null,
        createdAt: payload.created_at,
        updatedAt: payload.updated_at,
      }
    : undefined;

const mapPayment = (payload: GoodsIssuePaymentApiModel): GoodsIssuePayment => ({
  id: payload.id,
  uuid: payload.uuid,
  goodsTransactionBillingId: toNumber(payload.goods_transaction_billing_id),
  cashId: toNumber(payload.cash_id),
  amount: toNumber(payload.amount),
  transactionDate: payload.transaction_date ?? null,
  description: payload.description ?? null,
  createdAt: payload.created_at,
  cash: mapCash(payload.cash),
});

const mapBilling = (payload: GoodsIssueBillingApiModel): GoodsIssueBilling => ({
  id: payload.id,
  uuid: payload.uuid,
  goodsTransactionId: toNumber(payload.goods_transaction_id),
  isPaid: toBoolean(payload.is_paid),
  grandTotal: toNumber(payload.grand_total),
  createdAt: payload.created_at,
  payments: (payload.payments ?? []).map(mapPayment),
});

const mapItem = (payload: GoodsIssueItemApiModel): GoodsIssueItem => ({
  id: payload.id,
  uuid: payload.uuid,
  goodsTransactionId: toNumber(payload.goods_transaction_id),
  materialId: toNumber(payload.material_id),
  qty: toNumber(payload.qty),
  type: payload.type,
  price: toNumber(payload.price),
  total: toNumber(payload.total) || toNumber(payload.qty) * toNumber(payload.price),
  description: payload.description ?? null,
  createdAt: payload.created_at,
  updatedAt: payload.updated_at,
  material: mapMaterial(payload.material),
});

const mapBillings = (payload?: GoodsIssueBillingApiModel | GoodsIssueBillingApiModel[] | null): GoodsIssueBilling[] => {
  if (!payload) return [];
  return (Array.isArray(payload) ? payload : [payload]).map(mapBilling);
};

const mapIssue = (payload: GoodsIssueApiModel): GoodsIssue => ({
  id: payload.id,
  uuid: payload.uuid,
  code: payload.code,
  companyId: toNumber(payload.company_id),
  customerId: toNumber(payload.customer_id),
  type: 'issue',
  transactionDate: payload.transaction_date,
  location: payload.location ?? null,
  description: payload.description ?? null,
  invoiceFile: payload.invoice_file ?? null,
  createdAt: payload.created_at,
  totalBrutto: toNumber(payload.total_brutto),
  isPaid: toBoolean(payload.billing_status?.is_paid) || toBoolean(payload.is_paid),
  customer: mapCustomer(payload.customer),
  goodsTransactionBillings: mapBillings(payload.goods_transaction_billings),
});

const appendIssueForm = (body: FormData | URLSearchParams, payload: GoodsIssuePayload) => {
  body.append('type', 'issue');
  body.append('company_id', String(payload.companyId ?? 3));
  body.append('customer_id', String(payload.customerId));
  body.append('transaction_date', payload.transactionDate);
  if (payload.location) body.append('location', payload.location);
  if (payload.description) body.append('description', payload.description);
};

export const getGoodsIssues = async (
  params: PaginationParams & {
    companyId?: number | string;
    customer_name?: string;
    code?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    location?: string;
  },
): Promise<GoodsIssueListResponse> => {
  const response = await apiClient.get<PaginationApiResponse<GoodsIssueApiModel>>(basePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
      type: 'issue',
      company_id: params.companyId ?? 3,
      supplier_name: params.customer_name,
      code: params.code,
      sort_by: params.sort_by ?? 'created_at',
      sort_order: params.sort_order ?? 'desc',
      location: params.location,
    },
  });

  const data = ensureSuccess(response.data);
  return toPaginatedResult(normalizePagination(data), mapIssue);
};

export const getGoodsIssueById = async (id: number | string): Promise<GoodsIssueDetail> => {
  const response = await apiClient.get<ItemApiResponse<GoodsIssueApiModel>>(`${basePath}/${id}`);
  const data = ensureSuccess(response.data);
  return {
    ...mapIssue(data),
    goodsTransactionDetails: (data.goods_transaction_details ?? []).map(mapItem),
    goodsTransactionBillings: mapBillings(data.goods_transaction_billings),
  };
};

export const createGoodsIssue = async (payload: GoodsIssuePayload): Promise<GoodsIssue> => {
  try {
    const body = new URLSearchParams();
    appendIssueForm(body, payload);
    const response = await apiClient.post<ItemApiResponse<GoodsIssueApiModel>>(basePath, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return mapIssue(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateGoodsIssue = async (id: number | string, payload: GoodsIssuePayload): Promise<GoodsIssue> => {
  try {
    const body = new URLSearchParams();
    appendIssueForm(body, payload);
    const response = await apiClient.put<ItemApiResponse<GoodsIssueApiModel>>(`${basePath}/${id}`, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return mapIssue(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteGoodsIssue = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${basePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to delete goods issue');
  }
};

export const createGoodsIssueItem = async (payload: GoodsIssueItemPayload): Promise<GoodsIssueItem> => {
  try {
    const body = new FormData();
    body.append('goods_transaction_id', String(payload.goodsTransactionId));
    body.append('material_id', String(payload.materialId));
    body.append('qty', String(payload.qty));
    body.append('type', payload.type);
    body.append('price', String(payload.price));
    if (payload.description) body.append('description', payload.description);
    const response = await apiClient.post<ItemApiResponse<GoodsIssueItemApiModel>>(detailBasePath, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapItem(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateGoodsIssueItem = async (id: number | string, payload: GoodsIssueItemPayload): Promise<GoodsIssueItem> => {
  try {
    const body = new FormData();
    body.append('goods_transaction_id', String(payload.goodsTransactionId));
    body.append('material_id', String(payload.materialId));
    body.append('qty', String(payload.qty));
    body.append('type', payload.type);
    body.append('price', String(payload.price));
    if (payload.description) body.append('description', payload.description);
    const response = await apiClient.put<ItemApiResponse<GoodsIssueItemApiModel>>(`${detailBasePath}/${id}`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapItem(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteGoodsIssueItem = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${detailBasePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to delete goods issue detail');
  }
};

export const createGoodsIssueBilling = async (payload: GoodsIssueBillingPayload): Promise<GoodsIssueBilling> => {
  try {
    const body = new FormData();
    body.append('goods_transaction_id', String(payload.goodsTransactionId));
    const response = await apiClient.post<ItemApiResponse<GoodsIssueBillingApiModel>>(billingBasePath, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapBilling(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const createGoodsIssuePayment = async (payload: GoodsIssuePaymentPayload): Promise<GoodsIssuePayment> => {
  try {
    const body = new FormData();
    body.append('goods_transaction_billing_id', String(payload.goodsTransactionBillingId));
    body.append('cash_id', String(payload.cashId));
    body.append('amount', String(payload.amount));
    body.append('transaction_date', payload.transactionDate);
    if (payload.description) body.append('description', payload.description);
    const response = await apiClient.post<ItemApiResponse<GoodsIssuePaymentApiModel>>(paymentBasePath, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapPayment(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const uploadGoodsIssueInvoice = async (id: number | string, payload: GoodsIssueUploadInvoicePayload): Promise<void> => {
  try {
    const body = new FormData();
    body.append('invoice_file', payload.invoiceFile);
    const response = await apiClient.post<LaravelApiResponse<null>>(`${basePath}/${id}/upload-invoice`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    ensureSuccess(response.data);
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};
