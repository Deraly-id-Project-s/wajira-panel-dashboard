import type { PaginationParams } from '@/types/pagination.types';
import type {
  GoodsReceiptEquipment,
  GoodsReceiptEquipmentDetail,
  GoodsReceiptEquipmentPayload,
  GoodsReceiptEquipmentResponse,
  GoodsReceiptEquipmentBilling,
  GoodsReceiptEquipmentPayment,
  GoodsReceiptEquipmentBillingPayload,
  GoodsReceiptEquipmentPaymentPayload,
  GoodsTransactionDetailEquipment,
} from '@/types/goods-receipt-equipment.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, ApiValidationError, type LaravelApiResponse, ensureSuccess, toPaginatedResult } from '@/lib/api/response';

const basePath = '/wapi/transaction/goods-transaction';
const billingBasePath = '/wapi/transaction/goods-transaction-billing';
const paymentBasePath = '/wapi/transaction/goods-transaction-billing-payment';

const toNumber = (value: string | number | undefined | null) => Number(value ?? 0) || 0;
const toBoolean = (value: boolean | number | undefined | null) => value === true || value === 1;

const mapSupplier = (item: any) => {
  if (!item) return null;
  return {
    id: item.id,
    uuid: item.uuid,
    code: item.code || '',
    type: item.type || '',
    name: item.name || '',
    address: item.address || null,
    phone: item.phone || null,
  };
};

const mapCash = (item: any) => {
  if (!item) return null;
  return {
    id: item.id,
    uuid: item.uuid,
    code: item.code || '',
    description: item.description || '',
    type: item.type || 'cash',
    amount: item.amount ?? 0,
    companyId: item.company_id ?? null,
  };
};

const mapEquipment = (item: any) => {
  if (!item) return null;
  return {
    id: item.id,
    uuid: item.uuid,
    code: item.code || '',
    name: item.name || '',
  };
};

const mapDetailItem = (item: any): GoodsTransactionDetailEquipment => ({
  id: item.id,
  uuid: item.uuid,
  goodsTransactionId: toNumber(item.goods_transaction_id),
  vehicleEquipmentId: toNumber(item.vehicle_equipment_id),
  qty: toNumber(item.qty),
  price: toNumber(item.price),
  inStock: toBoolean(item.in_stock),
  isForecast: toBoolean(item.is_forecast),
  description: item.description ?? null,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
  total: toNumber(item.total) || toNumber(item.qty) * toNumber(item.price),
  vehicleEquipment: mapEquipment(item.vehicle_equipment),
});

const mapPayment = (item: any): GoodsReceiptEquipmentPayment => ({
  id: item.id,
  uuid: item.uuid,
  goodsTransactionBillingId: toNumber(item.goods_transaction_billing_id),
  cashId: toNumber(item.cash_id),
  amount: toNumber(item.amount),
  transactionDate: item.transaction_date ?? null,
  description: item.description ?? null,
  createdAt: item.created_at,
  cash: mapCash(item.cash),
});

const mapBilling = (item: any): GoodsReceiptEquipmentBilling => ({
  id: item.id,
  uuid: item.uuid,
  goodsTransactionId: toNumber(item.goods_transaction_id),
  isPaid: toBoolean(item.is_paid),
  grandTotal: toNumber(item.grand_total),
  createdAt: item.created_at,
  payments: (item.payments ?? []).map(mapPayment),
});

const mapBillings = (payload?: any | any[] | null): GoodsReceiptEquipmentBilling[] => {
  if (!payload) return [];
  return (Array.isArray(payload) ? payload : [payload]).map(mapBilling);
};

const mapReceipt = (item: any): GoodsReceiptEquipment => ({
  id: item.id,
  uuid: item.uuid,
  code: item.code || '',
  companyId: toNumber(item.company_id),
  supplierId: toNumber(item.supplier_id),
  type: 'receipt',
  transactionDate: item.transaction_date || '',
  location: item.location ?? null,
  description: item.description ?? null,
  invoiceFile: item.invoice_file ?? null,
  createdAt: item.created_at,
  totalBrutto: toNumber(item.total_brutto),
  isPaid: toBoolean(item.billing_status?.is_paid) || toBoolean(item.is_paid),
  supplier: mapSupplier(item.supplier),
  goodsTransactionBillings: mapBillings(item.goods_transaction_billings),
});

export const getGoodsReceiptEquipments = async (
  params: PaginationParams & {
    companyId?: number | string;
    code?: string;
    supplier_name?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    location?: string;
  },
): Promise<GoodsReceiptEquipmentResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
      type: 'receipt',
      company_id: params.companyId ?? 4,
      code: params.code,
      supplier_name: params.supplier_name,
      sort_by: params.sort_by ?? 'created_at',
      sort_order: params.sort_order ?? 'desc',
      location: params.location,
    },
  });

  const data = ensureSuccess(response.data);

  return toPaginatedResult(
    {
      data: data.data ?? [],
      current_page: data.current_page,
      per_page: data.per_page ?? 10,
      total: data.total,
      last_page: data.last_page,
    },
    mapReceipt,
  );
};

export const getGoodsReceiptEquipmentById = async (id: number | string): Promise<GoodsReceiptEquipmentDetail> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`);
  const data = ensureSuccess(response.data);

  return {
    ...mapReceipt(data),
    goodsTransactionDetails: (data.goods_transaction_details ?? []).map(mapDetailItem),
    goodsTransactionBillings: mapBillings(data.goods_transaction_billings),
  };
};

export const createGoodsReceiptEquipment = async (payload: GoodsReceiptEquipmentPayload): Promise<GoodsReceiptEquipment> => {
  try {
    const body = new URLSearchParams();
    body.append('type', 'receipt');
    body.append('company_id', String(payload.companyId ?? 4));
    body.append('supplier_id', String(payload.supplierId));
    body.append('transaction_date', payload.transactionDate);
    if (payload.location) body.append('location', payload.location);
    if (payload.description) body.append('description', payload.description);

    const response = await apiClient.post<LaravelApiResponse<any>>(basePath, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return mapReceipt(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateGoodsReceiptEquipment = async (
  id: number | string,
  payload: GoodsReceiptEquipmentPayload,
): Promise<GoodsReceiptEquipment> => {
  try {
    const body = new URLSearchParams();
    body.append('type', 'receipt');
    body.append('company_id', String(payload.companyId ?? 4));
    body.append('supplier_id', String(payload.supplierId));
    body.append('transaction_date', payload.transactionDate);
    if (payload.location) body.append('location', payload.location);
    if (payload.description) body.append('description', payload.description);

    const response = await apiClient.put<LaravelApiResponse<any>>(`${basePath}/${id}`, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return mapReceipt(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteGoodsReceiptEquipment = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${basePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to delete goods receipt transaction');
  }
};

export const createGoodsReceiptBilling = async (payload: GoodsReceiptEquipmentBillingPayload): Promise<GoodsReceiptEquipmentBilling> => {
  try {
    const body = new FormData();
    body.append('goods_transaction_id', String(payload.goodsTransactionId));

    const response = await apiClient.post<LaravelApiResponse<any>>(billingBasePath, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapBilling(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteGoodsReceiptBilling = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${billingBasePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to delete billing');
  }
};

export const createGoodsReceiptPayment = async (payload: GoodsReceiptEquipmentPaymentPayload): Promise<GoodsReceiptEquipmentPayment> => {
  try {
    const body = new FormData();
    body.append('goods_transaction_billing_id', String(payload.goodsTransactionBillingId));
    body.append('cash_id', String(payload.cashId));
    body.append('amount', String(payload.amount));
    body.append('transaction_date', payload.transactionDate);
    if (payload.description) body.append('description', payload.description);

    const response = await apiClient.post<LaravelApiResponse<any>>(paymentBasePath, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapPayment(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteGoodsReceiptPayment = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${paymentBasePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to delete billing payment');
  }
};
