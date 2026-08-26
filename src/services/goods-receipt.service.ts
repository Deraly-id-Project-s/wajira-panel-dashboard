import type {
  GoodsReceipt,
  GoodsReceiptBilling,
  GoodsReceiptBillingPayload,
  GoodsReceiptDetail,
  GoodsReceiptItem,
  GoodsReceiptItemPayload,
  GoodsReceiptListResponse,
  GoodsReceiptPayload,
  GoodsReceiptPayment,
  GoodsReceiptPaymentPayload,
  GoodsReceiptUploadInvoicePayload,
} from '@/types/goods-receipt.types';
import type { PaginationParams } from '@/types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, ApiValidationError, type LaravelApiResponse, ensureSuccess, toPaginatedResult } from '@/lib/api/response';

interface SupplierApiModel {
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

interface GoodsReceiptPaymentApiModel {
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

interface GoodsReceiptBillingApiModel {
  id: number;
  uuid?: string;
  goods_transaction_id: number | string;
  is_paid?: boolean | number;
  grand_total?: number | string;
  created_at?: string;
  payments?: GoodsReceiptPaymentApiModel[] | null;
}

interface GoodsReceiptItemApiModel {
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

interface GoodsReceiptApiModel {
  id: number;
  uuid?: string;
  code: string;
  company_id: number | string;
  supplier_id: number | string;
  type: 'receipt';
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
  supplier?: SupplierApiModel | null;
  goods_transaction_details?: GoodsReceiptItemApiModel[] | null;
  goods_transaction_billings?: GoodsReceiptBillingApiModel | GoodsReceiptBillingApiModel[] | null;
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

const mapSupplier = (payload?: SupplierApiModel | null) =>
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

const mapPayment = (payload: GoodsReceiptPaymentApiModel): GoodsReceiptPayment => ({
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

const mapBilling = (payload: GoodsReceiptBillingApiModel): GoodsReceiptBilling => ({
  id: payload.id,
  uuid: payload.uuid,
  goodsTransactionId: toNumber(payload.goods_transaction_id),
  isPaid: toBoolean(payload.is_paid),
  grandTotal: toNumber(payload.grand_total),
  createdAt: payload.created_at,
  payments: (payload.payments ?? []).map(mapPayment),
});

const mapItem = (payload: GoodsReceiptItemApiModel): GoodsReceiptItem => ({
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

const mapBillings = (payload?: GoodsReceiptBillingApiModel | GoodsReceiptBillingApiModel[] | null): GoodsReceiptBilling[] => {
  if (!payload) return [];
  return (Array.isArray(payload) ? payload : [payload]).map(mapBilling);
};

const mapReceipt = (payload: GoodsReceiptApiModel): GoodsReceipt => {
  const goodsTransactionBillings = mapBillings(payload.goods_transaction_billings);
  return {
    id: payload.id,
    uuid: payload.uuid,
    code: payload.code,
    companyId: toNumber(payload.company_id),
    supplierId: toNumber(payload.supplier_id),
    type: 'receipt',
    transactionDate: payload.transaction_date,
    location: payload.location ?? null,
    description: payload.description ?? null,
    invoiceFile: payload.invoice_file ?? null,
    createdAt: payload.created_at,
    totalBrutto: toNumber(payload.total_brutto),
    isPaid: toBoolean(payload.billing_status?.is_paid) || toBoolean(payload.is_paid),
    supplier: mapSupplier(payload.supplier),
    goodsTransactionBillings,
  };
};

const appendReceiptForm = (body: FormData | URLSearchParams, payload: GoodsReceiptPayload) => {
  body.append('type', 'receipt');
  body.append('company_id', String(payload.companyId ?? 3));
  body.append('supplier_id', String(payload.supplierId));
  body.append('transaction_date', payload.transactionDate);
  if (payload.location) body.append('location', payload.location);
  if (payload.description) body.append('description', payload.description);
};

export const getGoodsReceipts = async (
  params: PaginationParams & {
    companyId?: number | string;
    supplier_name?: string;
    code?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    location?: string;
  },
): Promise<GoodsReceiptListResponse> => {
  const response = await apiClient.get<PaginationApiResponse<GoodsReceiptApiModel>>(basePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
      type: 'receipt',
      company_id: params.companyId ?? 3,
      supplier_name: params.supplier_name,
      code: params.code,
      sort_by: params.sort_by ?? 'created_at',
      sort_order: params.sort_order ?? 'desc',
      location: params.location,
    },
  });

  const data = ensureSuccess(response.data);
  return toPaginatedResult(normalizePagination(data), mapReceipt);
};

export const getGoodsReceiptById = async (id: number | string): Promise<GoodsReceiptDetail> => {
  const response = await apiClient.get<ItemApiResponse<GoodsReceiptApiModel>>(`${basePath}/${id}`);
  const data = ensureSuccess(response.data);

  return {
    ...mapReceipt(data),
    goodsTransactionDetails: (data.goods_transaction_details ?? []).map(mapItem),
    goodsTransactionBillings: mapBillings(data.goods_transaction_billings),
  };
};

export const createGoodsReceipt = async (payload: GoodsReceiptPayload): Promise<GoodsReceipt> => {
  try {
    const body = new URLSearchParams();
    appendReceiptForm(body, payload);
    const response = await apiClient.post<ItemApiResponse<GoodsReceiptApiModel>>(basePath, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return mapReceipt(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateGoodsReceipt = async (id: number | string, payload: GoodsReceiptPayload): Promise<GoodsReceipt> => {
  try {
    const body = new URLSearchParams();
    appendReceiptForm(body, payload);
    const response = await apiClient.put<ItemApiResponse<GoodsReceiptApiModel>>(`${basePath}/${id}`, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return mapReceipt(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteGoodsReceipt = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${basePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to delete goods receipt');
  }
};

export const createGoodsReceiptItem = async (payload: GoodsReceiptItemPayload): Promise<GoodsReceiptItem> => {
  try {
    const body = new FormData();
    body.append('goods_transaction_id', String(payload.goodsTransactionId));
    body.append('material_id', String(payload.materialId));
    body.append('qty', String(payload.qty));
    body.append('type', payload.type);
    body.append('price', String(payload.price));
    if (payload.description) body.append('description', payload.description);

    const response = await apiClient.post<ItemApiResponse<GoodsReceiptItemApiModel>>(detailBasePath, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapItem(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateGoodsReceiptItem = async (id: number | string, payload: GoodsReceiptItemPayload): Promise<GoodsReceiptItem> => {
  try {
    const body = new URLSearchParams();
    body.append('goods_transaction_id', String(payload.goodsTransactionId));
    body.append('material_id', String(payload.materialId));
    body.append('qty', String(payload.qty));
    body.append('type', payload.type);
    body.append('price', String(payload.price));
    if (payload.description) body.append('description', payload.description);

    const response = await apiClient.put<ItemApiResponse<GoodsReceiptItemApiModel>>(`${detailBasePath}/${id}`, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return mapItem(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteGoodsReceiptItem = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${detailBasePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to delete goods receipt detail');
  }
};

export const createGoodsReceiptBilling = async (payload: GoodsReceiptBillingPayload): Promise<GoodsReceiptBilling> => {
  try {
    const body = new FormData();
    body.append('goods_transaction_id', String(payload.goodsTransactionId));
    const response = await apiClient.post<ItemApiResponse<GoodsReceiptBillingApiModel>>(billingBasePath, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapBilling(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const createGoodsReceiptPayment = async (payload: GoodsReceiptPaymentPayload): Promise<GoodsReceiptPayment> => {
  try {
    const body = new FormData();
    body.append('goods_transaction_billing_id', String(payload.goodsTransactionBillingId));
    body.append('cash_id', String(payload.cashId));
    body.append('amount', String(payload.amount));
    body.append('transaction_date', payload.transactionDate);
    if (payload.description) body.append('description', payload.description);

    const response = await apiClient.post<ItemApiResponse<GoodsReceiptPaymentApiModel>>(paymentBasePath, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapPayment(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const uploadGoodsReceiptInvoice = async (id: number | string, payload: GoodsReceiptUploadInvoicePayload): Promise<void> => {
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
