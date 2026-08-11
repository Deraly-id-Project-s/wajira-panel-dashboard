import { apiClient } from '@/lib/api/client';

export interface PurchaseTransactionParams {
  page?: number;
  per_page?: number;
  start_date?: string;
  end_date?: string;
  person_id?: number;
  search?: string;
  sort_order?: 'asc' | 'desc';
  company_id?: string | number | null;
}

export interface PurchaseTransactionItem {
  id: number;
  transaction_date: string;
  transaction_code: string;
  person_name: string;
  unit_name: string;
  unit_code: string;
  qty: number;
  price: number;
  dpp: number;
  ppn: number;
  bbn: number;
  other_fee: number;
  expedition_fee: number;
  hpp_fee: number;
  total: number;
  is_paid: boolean;
  payment_status: string;
}

export interface PurchaseTransactionResponse {
  current_page: number;
  data: PurchaseTransactionItem[];
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export const getLaporanPembelian = async (
  params: PurchaseTransactionParams
): Promise<PurchaseTransactionResponse> => {
  const response = await apiClient.get('/wapi/report/transaction-purchase-report', {
    params: {
      ...params,
    },
  });

  const payload = response?.data?.data ?? response?.data ?? {};
  const rows = Array.isArray(payload?.data) ? payload.data : [];

  return {
    ...payload,
    data: rows,
  } as PurchaseTransactionResponse;
};

export const getSuppliers = async () => {
  const response = await apiClient.get('/wapi/master-data/supplier', {
    params: { per_page: 1000 }
  });
  return response.data.data;
};

export const getUnitTypes = async () => {
  const response = await apiClient.get('/wapi/master-data/unit-type', {
    params: { sort_by: 'created_at', sort_order: 'asc', per_page: 50 }
  });
  return response.data.data;
};