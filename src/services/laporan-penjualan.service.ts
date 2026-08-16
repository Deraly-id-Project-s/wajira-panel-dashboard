import { apiClient } from '@/lib/api/client';

export interface SalesTransactionParams {
    page?: number;
    per_page?: number;
    start_date?: string;
    end_date?: string;
    person_id?: number;
    search?: string;
    sort_order?: 'asc' | 'desc';
    company_id?: string | number | null;
}

export interface SalesTransactionItem {
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

export interface SalesSparepartTransactionItem {
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

export interface SalesTransactionResponse {
    current_page: number;
    data: SalesTransactionItem[];
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

export type SalesSparepartTransactionResponse = Omit<SalesTransactionResponse, 'data'> & {
    data: SalesSparepartTransactionItem[];
};

const normalizeReportResponse = <T>(responseData: any) => {
    const payload = responseData?.data ?? responseData ?? {};
    const rows = Array.isArray(payload?.data) ? payload.data : [];

    return {
        ...payload,
        data: rows,
    } as Omit<SalesTransactionResponse, 'data'> & { data: T[] };
};

export const getLaporanPenjualan = async (
    params: SalesTransactionParams
): Promise<SalesTransactionResponse> => {
    const response = await apiClient.get('/wapi/report/transaction-sales-report', {
        params: {
            ...params,
        },
    });
    return normalizeReportResponse<SalesTransactionItem>(response.data);
};

export const getLaporanPenjualanSparepart = async (
    params: SalesTransactionParams
): Promise<SalesSparepartTransactionResponse> => {
    const response = await apiClient.get('/wapi/report/transaction-sparepart-sales-report', {
        params: {
            ...params,
        },
    });

    return normalizeReportResponse<SalesSparepartTransactionItem>(response.data);
};

export const getCustomers = async () => {
    const response = await apiClient.get('/wapi/master-data/customer', {
        params: { per_page: 1000 },
    });
    return response.data.data;
};

export const getUnitTypes = async () => {
    const response = await apiClient.get('/wapi/master-data/unit-type', {
        params: { sort_by: 'created_at', sort_order: 'asc' },
    });
    return response.data.data;
};
