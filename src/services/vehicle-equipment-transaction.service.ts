import { apiClient } from '@/lib/api/client';
import { ensureSuccess, mapLaravelPaginationMeta, type LaravelApiResponse } from '@/lib/api/response';
import type { PaginationMeta, PaginationParams } from '@/@types/pagination.types';
import type {
  CreateVehicleEquipmentBillingHistoryPayload,
  CreateVehicleEquipmentTransactionPayload,
  UpdateVehicleEquipmentBillingHistoryPayload,
  UpdateVehicleEquipmentTransactionPayload,
  VehicleEquipmentBillingHistory,
  VehicleEquipmentTransaction,
  VehicleEquipmentTransactionResponse,
} from '@/@types/vehicle-equipment-transaction.types';

const basePath = '/wapi/transaction/goods-transaction';
const billingHistoryPath = '/wapi/transaction/goods-transaction-billing-history';
const billingPath = '/wapi/transaction/goods-transaction-billing';

const appendIfPresent = (form: FormData, key: string, value: unknown) => {
  if (value === undefined || value === null || value === '') return;
  const isFile = typeof File !== 'undefined' && value instanceof File;
  form.append(key, isFile ? value : String(value));
};

const buildTransactionForm = (
  payload: CreateVehicleEquipmentTransactionPayload | UpdateVehicleEquipmentTransactionPayload,
  method?: 'PUT',
) => {
  const form = new FormData();
  if (method) form.append('_method', method);
  appendIfPresent(form, 'company_id', payload.company_id);
  appendIfPresent(form, 'warehouse_id', payload.warehouse_id);
  form.append('transaction_type', payload.transaction_type || 'vehicle_equipment');
  form.append('person_id', String(payload.person_id));
  form.append('vehicle_equipment_id', String(payload.vehicle_equipment_id));
  form.append('type', payload.type);
  form.append('billing_type', payload.billing_type);
  form.append('qty', String(payload.qty));
  form.append('price', String(payload.price));
  form.append('discount', String(payload.discount));
  form.append('transaction_date', payload.transaction_date);
  appendIfPresent(form, 'nota_number', payload.nota_number);
  appendIfPresent(form, 'billing_due_date', payload.billing_due_date);
  appendIfPresent(form, 'invoice_file', payload.invoice_file);
  appendIfPresent(form, 'note', payload.note);
  return form;
};

const buildBillingHistoryForm = (
  payload: CreateVehicleEquipmentBillingHistoryPayload | UpdateVehicleEquipmentBillingHistoryPayload,
  method?: 'PUT',
) => {
  const form = new FormData();
  if (method) form.append('_method', method);
  form.append('goods_transaction_billing_id', String(payload.goods_transaction_billing_id));
  form.append('payment_at', payload.payment_at);
  appendIfPresent(form, 'cash_payment_amount', payload.cash_payment_amount);
  appendIfPresent(form, 'bca_payment_amount', payload.bca_payment_amount);
  appendIfPresent(form, 'bca_payment_usd_amount', payload.bca_payment_usd_amount);
  appendIfPresent(form, 'note', payload.note);
  appendIfPresent(form, 'payment_proof', payload.payment_proof);
  return form;
};

export const vehicleEquipmentTransactionService = {
  async getTransactions(
    params: PaginationParams & {
      warehouse_id?: number | string;
      is_refunded?: boolean;
      code?: string;
      transaction_type?: string;
      type?: 'purchase' | 'sales';
      person_id?: number | string;
      vehicle_equipment_id?: number | string;
      billing_type?: string;
      company_id?: number | string;
      start_date?: string | null;
      end_date?: string | null;
    } = {},
  ): Promise<VehicleEquipmentTransactionResponse> {
    const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
      params: {
        page: params.page ?? 1,
        per_page: params.perPage ?? 10,
        sort_order: 'desc',
        search: params.search || undefined,
        warehouse_id: params.warehouse_id || undefined,
        is_refunded: params.is_refunded ?? undefined,
        code: params.code || undefined,
        type: params.type || undefined,
        transaction_type: params.transaction_type || 'vehicle_equipment',
        person_id: params.person_id || undefined,
        vehicle_equipment_id: params.vehicle_equipment_id || undefined,
        billing_type: params.billing_type || undefined,
        company_id: params.company_id || undefined,
        start_date: params.start_date || undefined,
        end_date: params.end_date || undefined,
      },
    });

    const payload = ensureSuccess(response.data);
    return {
      data: payload.data ?? [],
      meta: mapLaravelPaginationMeta(payload),
    };
  },

  async getTransactionById(id: string): Promise<VehicleEquipmentTransaction> {
    const response = await apiClient.get<LaravelApiResponse<VehicleEquipmentTransaction>>(`${basePath}/${id}`);
    return ensureSuccess(response.data);
  },

  async createTransaction(payload: CreateVehicleEquipmentTransactionPayload): Promise<VehicleEquipmentTransaction> {
    const response = await apiClient.post<LaravelApiResponse<VehicleEquipmentTransaction>>(
      basePath,
      buildTransactionForm(payload),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return ensureSuccess(response.data);
  },

  async updateTransaction(id: string, payload: UpdateVehicleEquipmentTransactionPayload): Promise<VehicleEquipmentTransaction> {
    const response = await apiClient.post<LaravelApiResponse<VehicleEquipmentTransaction>>(
      `${basePath}/${id}`,
      buildTransactionForm(payload, 'PUT'),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return ensureSuccess(response.data);
  },

  async deleteTransaction(id: string): Promise<void> {
    await apiClient.delete<LaravelApiResponse<null>>(`${basePath}/${id}`);
  },

  async updateBillingPaymentStatus(billingId: string, isPaid: boolean): Promise<void> {
    const data = new URLSearchParams();
    data.append('is_paid', String(isPaid));

    await apiClient.put<LaravelApiResponse<null>>(`${billingPath}/${billingId}`, data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },

  async getBillingHistories(
    params: PaginationParams & { goods_transaction_billing_id?: number | string } = {},
  ): Promise<{ data: VehicleEquipmentBillingHistory[]; meta: PaginationMeta }> {
    const response = await apiClient.get<LaravelApiResponse<any>>(billingHistoryPath, {
      params: {
        page: params.page ?? 1,
        per_page: params.perPage ?? 25,
        search: params.search || undefined,
        goods_transaction_billing_id: params.goods_transaction_billing_id || undefined,
      },
    });

    const payload = ensureSuccess(response.data);
    return {
      data: payload.data ?? [],
      meta: mapLaravelPaginationMeta(payload),
    };
  },

  async createBillingHistory(payload: CreateVehicleEquipmentBillingHistoryPayload): Promise<VehicleEquipmentBillingHistory> {
    const response = await apiClient.post<LaravelApiResponse<VehicleEquipmentBillingHistory>>(
      billingHistoryPath,
      buildBillingHistoryForm(payload),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return ensureSuccess(response.data);
  },

  async updateBillingHistory(id: string, payload: UpdateVehicleEquipmentBillingHistoryPayload): Promise<VehicleEquipmentBillingHistory> {
    const response = await apiClient.post<LaravelApiResponse<VehicleEquipmentBillingHistory>>(
      `${billingHistoryPath}/${id}`,
      buildBillingHistoryForm(payload, 'PUT'),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return ensureSuccess(response.data);
  },

  async deleteBillingHistory(id: string): Promise<void> {
    await apiClient.delete<LaravelApiResponse<null>>(`${billingHistoryPath}/${id}`);
  },
};
