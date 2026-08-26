import type { LaravelPagination, PaginationMeta } from '@/types/pagination.types';

export interface RefundJual {
  id: number;
  noPenjualan: string;
  tanggal: string;
  namaCustomer: string;
  totalPenjualan: number;
  totalRefund: number;
  kasKeluar: string;
  keterangan: string;
}

export interface RefundCustomer {
  id: number;
  name: string;
}

export interface RefundCash {
  id: number;
  description: string;
}

export interface RawRefundJualResponse {
  id: number | string;
  refund_number?: string | null;
  sales_number?: string | null;
  code?: string | null;
  date?: string | null;
  customer?: Partial<RefundCustomer> | null;
  total_sales?: number | string | null;
  total_refund?: number | string | null;
  cash?: Partial<RefundCash> | null;
  note?: string | null;
}

export interface RefundJualPagination extends PaginationMeta {
  from: number;
  to: number;
}

export interface RefundJualListResponse {
  status: boolean;
  message?: string;
  errors: Record<string, string[]> | null;
  data: LaravelPagination<RawRefundJualResponse>;
}

export interface RefundJualListResult {
  data: RefundJual[];
  pagination: RefundJualPagination;
}

export interface RefundJualQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
}
