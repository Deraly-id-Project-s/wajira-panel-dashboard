import type { LaravelPagination, PaginationMeta } from '@/types/pagination.types';

export interface RefundBeli {
  id: number;
  noPembelian: string;
  tanggal: string;
  namaSupplier: string;
  totalPembelian: number;
  totalRefund: number;
  kasMasuk: string;
  keterangan: string;
}

export interface RefundSupplier {
  id: number;
  name: string;
}

export interface RefundCash {
  id: number;
  description: string;
}

export interface RawRefundBeliResponse {
  id: number | string;
  refund_number?: string | null;
  purchase_number?: string | null;
  code?: string | null;
  date?: string | null;
  supplier?: Partial<RefundSupplier> | null;
  total_purchase?: number | string | null;
  total_refund?: number | string | null;
  cash?: Partial<RefundCash> | null;
  note?: string | null;
}

export interface RefundBeliPagination extends PaginationMeta {
  from: number;
  to: number;
}

export interface RefundBeliListResponse {
  status: boolean;
  message?: string;
  errors: Record<string, string[]> | null;
  data: LaravelPagination<RawRefundBeliResponse>;
}

export interface RefundBeliListResult {
  data: RefundBeli[];
  pagination: RefundBeliPagination;
}

export interface RefundBeliQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
}
