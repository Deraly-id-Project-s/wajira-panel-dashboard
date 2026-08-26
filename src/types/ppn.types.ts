import { z } from 'zod';
import type { LaravelPagination, PaginationMeta } from '@/types/pagination.types';

export interface UnitType {
  id: number;
  code: string;
  name: string;
  unit_type: string;
  unit_model: string;
}

export interface UnitTransactionItemDetail {
  id: number;
  machine_number: string;
  chassis_number: string;
  color: string;
}

export interface PPNItem {
  id: number;
  code: string;
  buy_date: string;
  supplier: string;
  fp_date: string | null;
  nsfp_age: string | null;
  qty: number;
  unit_type: UnitType;
  unit_transaction_item_detail: UnitTransactionItemDetail;
  unit_price: number;
  total_price: number;
  dpp_amount: number;
  ppn_11: number;
  payment_amount: number;
  nsfp_number: string | null;
}

export type PPNPembelian = PPNItem;
export type PPNPenjualan = PPNItem;

export interface UpdatePPNPayload {
  fp_date?: string;
  nsfp_age?: string;
  amount?: number;
  nsfp_number?: string;
}

export type UpdatePPNPembelianPayload = UpdatePPNPayload;
export type UpdatePPNPenjualanPayload = UpdatePPNPayload;

export interface UpdatePPNMutationPayload {
  id: number;
  payload: UpdatePPNPayload;
}

export type UpdatePPNPembelianMutationPayload = UpdatePPNMutationPayload;
export type UpdatePPNPenjualanMutationPayload = UpdatePPNMutationPayload;

export interface PPNListResponse {
  status: boolean;
  message: string;
  errors: Record<string, string[]> | null;
  data: LaravelPagination<PPNItem>;
}

export type PPNPembelianListResponse = PPNListResponse;
export type PPNPenjualanListResponse = PPNListResponse;

export interface PPNUpdateResponse {
  status: boolean;
  message: string;
  errors: Record<string, string[]> | null;
  data: {
    id: number;
    fp_date: string | null;
    nsfp_age: string | null;
    amount: string;
  };
}

export type PPNPembelianUpdateResponse = PPNUpdateResponse;
export type PPNPenjualanUpdateResponse = PPNUpdateResponse;

export interface BulkUpdatePPNPayload {
  ppn_data_ids: number[];
  fp_date?: string;
  nsfp_age?: string;
  nsfp_amount?: number;
  amount?: number;
  nsfp_number?: string;
}

export type BulkUpdatePPNPembelianPayload = BulkUpdatePPNPayload;
export type BulkUpdatePPNPenjualanPayload = BulkUpdatePPNPayload;

export interface BulkUpdatePPNResponse {
  status: boolean;
  message: string;
  errors: Record<string, string[]> | null;
  data: any;
}

export type BulkUpdatePPNPembelianResponse = BulkUpdatePPNResponse;
export type BulkUpdatePPNPenjualanResponse = BulkUpdatePPNResponse;

export const UpdatePPNSchema = z.object({
  fp_date: z.date().optional().nullable(),
  nsfp_age: z.date().optional().nullable(),
  amount: z.number().optional().nullable(),
  nsfp_number: z.string().optional().nullable(),
});

export const UpdatePPNPembelianSchema = UpdatePPNSchema;
export const UpdatePPNPenjualanSchema = UpdatePPNSchema;

export type UpdatePPNFormValues = z.infer<typeof UpdatePPNSchema>;
export type UpdatePPNPembelianFormValues = UpdatePPNFormValues;
export type UpdatePPNPenjualanFormValues = UpdatePPNFormValues;

export interface PPNFilterParams {
  type?: 'ppn_purchase' | 'ppn_sales';
  page?: number;
  per_page?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

export type PPNPembelianFilterParams = PPNFilterParams;
export type PPNPenjualanFilterParams = PPNFilterParams;

export interface PPNListResult {
  data: PPNItem[];
  meta: PaginationMeta;
  hasNextPage: boolean;
  isTotalExact: boolean;
}

export type PPNPembelianListResult = PPNListResult;
export type PPNPenjualanListResult = PPNListResult;
