import type { Kas } from './kas.types';

export type BalanceReportTemplateType = 'assets' | 'liabilities';

export type BalanceReportTemplateKey =
  | 'receivable_ids'
  | 'down_payment_ids'
  | 'fixed_asset_ids'
  | 'accounts_payable_ids'
  | 'tax_payable_ids'
  | 'miscellaneous_debts_ids'
  | 'equity_ids';

export interface BalanceReportTemplatePayload {
  type: BalanceReportTemplateType;
  receivable_ids?: number[];
  down_payment_ids?: number[];
  fixed_asset_ids?: number[];
  accounts_payable_ids?: number[];
  tax_payable_ids?: number[];
  miscellaneous_debts_ids?: number[];
  equity_ids?: number[];
}

export interface BalanceReportTemplate {
  id: number;
  company_id: number;
  type: BalanceReportTemplateType;
  receivable_ids: number[] | null;
  down_payment_ids: number[] | null;
  fixed_asset_ids: number[] | null;
  accounts_payable_ids: number[] | null;
  tax_payable_ids: number[] | null;
  miscellaneous_debts_ids: number[] | null;
  equity_ids: number[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  ballance_cashes?: BalanceReportCash[];
}

export interface BalanceReportCash {
  id: number;
  ballance_template_id: number;
  cash_id: number;
  value: number | string;
  created_at?: string | null;
  updated_at?: string | null;
  cash?: Kas | null;
}

export interface BalanceReportCashPayload {
  cash_id: number;
  value: number;
}

export interface BalanceReportCashCalcItem {
  id: number;
  cash_id: number;
  cash_name: string;
  cash_code?: string | null;
  value: number | string;
  type?: 'IDR' | 'USD' | string | null;
}

export interface BalanceReportAccountLine {
  id?: number | string | null;
  account_id?: number | string | null;
  account_code?: string | null;
  account_name?: string | null;
  code?: string | null;
  name?: string | null;
  amount?: number | string | null;
  value?: number | string | null;
  total?: number | string | null;
  type?: 'IDR' | 'USD' | string | null;
}

export interface BalanceReportCalcSection {
  total: number | string;
  total_idr?: number | string | null;
  total_usd?: number | string | null;
  accounts?: BalanceReportAccountLine[];
  items?: BalanceReportCashCalcItem[];
}

export interface BalanceReportData {
  assets_template?: BalanceReportTemplate | null;
  liabilities_template?: BalanceReportTemplate | null;
  company_cashes?: BalanceReportCash[];
  cashes_calc?: BalanceReportCalcSection;
  receivable_calc?: BalanceReportCalcSection;
  down_payment_calc?: BalanceReportCalcSection;
  fixed_asset_calc?: BalanceReportCalcSection;
  accounts_payable_calc?: BalanceReportCalcSection;
  tax_payable_calc?: BalanceReportCalcSection;
  miscellaneous_debts_calc?: BalanceReportCalcSection;
  equity_calc?: BalanceReportCalcSection;
  total_assets?: number | string;
  total_assets_usd?: number | string;
  total_liabilities?: number | string;
  total_liabilities_usd?: number | string;
  total_equity?: number | string;
  total_equity_usd?: number | string;
  total_passiva?: number | string;
  total_passiva_usd?: number | string;
  [key: string]: unknown;
}

export interface BalanceReportResponse {
  status?: boolean;
  message?: string;
  errors?: unknown;
  data?: BalanceReportData;
}

export interface BalanceReportCashListResponse {
  status?: boolean;
  message?: string;
  errors?: unknown;
  data?: Kas[];
}
