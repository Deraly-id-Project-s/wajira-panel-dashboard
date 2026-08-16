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

export interface PurchaseSparepartTransactionItem {
  id: number;
  transaction_date: string;
  transaction_code: string;
  person_name: string;
  sparepart_name: string;
  sparepart_code: string;
  qty: number;
  price: number;
  discount: number;
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

export type PurchaseSparepartTransactionResponse = Omit<PurchaseTransactionResponse, 'data'> & {
  data: PurchaseSparepartTransactionItem[];
};

const normalizeReportResponse = <T>(responseData: any) => {
  const payload = responseData?.data ?? responseData ?? {};
  const rows = Array.isArray(payload?.data) ? payload.data : [];

  return {
    ...payload,
    data: rows,
  } as Omit<PurchaseTransactionResponse, 'data'> & { data: T[] };
};

export const getLaporanPembelian = async (
  params: PurchaseTransactionParams
): Promise<PurchaseTransactionResponse> => {
  const response = await apiClient.get('/wapi/report/transaction-purchase-report', {
    params: {
      ...params,
    },
  });

  return normalizeReportResponse<PurchaseTransactionItem>(response.data);
};

export const getLaporanPembelianSparepart = async (
  params: PurchaseTransactionParams
): Promise<PurchaseSparepartTransactionResponse> => {
  const response = await apiClient.get('/wapi/report/transaction-sparepart-purchase-report', {
    params: {
      ...params,
    },
  });

  return normalizeReportResponse<PurchaseSparepartTransactionItem>(response.data);
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
