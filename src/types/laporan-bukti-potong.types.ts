import type { PaginatedResult } from './pagination.types';

export interface WithholdingTaxReport {
  id: number;
  company_id: number;
  tgl_invoice: string;
  no_invoice: string;
  nama_customer: string;
  no_bukpot: string;
  masa_bukpot: string;
  nominal_invoice: number;
  pph: number;
  uang_muka_pph: string;
  jumlah_pembayaran: number;
  tgl_dibayar: string;
  created_at?: string;
  updated_at?: string;
}

export interface WithholdingTaxReportListParams {
  company_id: number;
  page?: number;
  per_page?: number;
  search?: string;
}

export interface UpdateWithholdingTaxReportPayload {
  no_bukpot: string;
  masa_bukpot: string;
  pph: number;
  uang_muka_pph: string;
  jumlah_pembayaran: number;
  tgl_dibayar: string;
}

export type WithholdingTaxReportListResponse = PaginatedResult<WithholdingTaxReport>;

