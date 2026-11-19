import type { Kas } from './kas.types';

export type BalanceTemplateKey =
  | 'current_asset_account_ids'
  | 'fixed_asset_account_ids'
  | 'liability_account_ids'
  | 'equity_account_ids';

export type MonthKey =
  | 'january'
  | 'february'
  | 'march'
  | 'april'
  | 'may'
  | 'june'
  | 'july'
  | 'august'
  | 'september'
  | 'october'
  | 'november'
  | 'december';

// ==========================================
// Balance Sheet Template & Config Types
// ==========================================
export interface BalanceSheetConfig {
  current_asset_account_ids: number[];
  fixed_asset_account_ids: number[];
  liability_account_ids: number[];
  equity_account_ids: number[];
}

export interface BalanceTemplateYear {
  id: number;
  ballance_template_id: number;
  year: number;
  config: BalanceSheetConfig;
  created_at?: string;
  updated_at?: string;
}

export interface BalanceTemplate {
  id: number;
  company_id: number;
  created_at?: string;
  updated_at?: string;
  ballance_template_years: BalanceTemplateYear[];
}

export interface BalanceTemplateResponse {
  status?: boolean;
  message?: string;
  errors?: unknown;
  data?: {
    template: BalanceTemplate;
    default_structure: BalanceSheetConfig;
  };
}

export interface BalanceTemplateYearResponse {
  status?: boolean;
  message?: string;
  errors?: unknown;
  data?: BalanceTemplateYear;
}

// ==========================================
// Request Payloads
// ==========================================
export interface CreateBalanceYearPayload {
  year: number;
  current_asset_account_ids?: number[];
  fixed_asset_account_ids?: number[];
  liability_account_ids?: number[];
  equity_account_ids?: number[];
  config?: Partial<BalanceSheetConfig>;
}

export interface UpdateBalanceYearPayload {
  year?: number;
  current_asset_account_ids?: number[];
  fixed_asset_account_ids?: number[];
  liability_account_ids?: number[];
  equity_account_ids?: number[];
  config?: Partial<BalanceSheetConfig>;
}

export type SaveBalanceTemplateYearPayload = CreateBalanceYearPayload;

// ==========================================
// Balance Sheet Report Line & Category Types
// ==========================================
export interface BalanceAccountItem {
  id: number | string;
  account_id?: number | string;
  account_code?: string | null;
  code?: string | null;
  account_name?: string | null;
  name?: string | null;
  account_type?: 'debit' | 'credit' | 'debet' | string | null;
  type?: 'debit' | 'credit' | 'debet' | 'IDR' | 'USD' | string | null;
  debit?: number | string | null;
  credit?: number | string | null;
  balance?: number | string | null;
  amount?: number | string | null;
  value?: number | string | null;
  total?: number | string | null;
  is_contra?: boolean;
}

export type BalanceReportLine = BalanceAccountItem;

export interface CurrentAssetsSection {
  title: string;
  accounts: BalanceAccountItem[];
  subtotal: number;
  subtotal_usd?: number;
}

export interface FixedAssetsSection {
  title: string;
  accounts: BalanceAccountItem[];
  gross_total: number;
  gross_total_usd?: number;
  accumulated_depreciation_accounts: BalanceAccountItem[];
  accumulated_depreciation_total: number;
  accumulated_depreciation_total_usd?: number;
  subtotal: number;
  subtotal_usd?: number;
}

export interface LiabilitiesSection {
  title: string;
  accounts: BalanceAccountItem[];
  subtotal: number;
  subtotal_usd?: number;
}

export interface EquityModalAwal {
  title: string;
  source?: string;
  accounts: BalanceAccountItem[];
  total: number;
  total_usd?: number;
}

export interface EquitySpecialItem {
  title: string;
  source?: string;
  amount: number;
  amount_usd?: number;
  note?: string;
}

export interface EquitySection {
  title: string;
  modal_awal: EquityModalAwal;
  laba_ditahan: EquitySpecialItem;
  laba_periode_berjalan: EquitySpecialItem;
  subtotal: number;
  subtotal_usd?: number;
  accounts?: BalanceAccountItem[];
}

export interface BalanceSheetSections {
  current_assets: CurrentAssetsSection;
  fixed_assets: FixedAssetsSection;
  liabilities: LiabilitiesSection;
  equity: EquitySection;
}

export interface BalanceSheetSubtotals {
  jumlah_aset_lancar: number;
  jumlah_aset_tetap: number;
  total_aktiva: number;
  jumlah_kewajiban: number;
  jumlah_modal: number;
  total_pasiva: number;
  difference: number;
  is_balance: boolean;
  status_balance: 'BALANCE' | 'TIDAK BALANCE' | string;
  jumlah_aset_lancar_usd?: number;
  jumlah_aset_tetap_usd?: number;
  total_aktiva_usd?: number;
  jumlah_kewajiban_usd?: number;
  jumlah_modal_usd?: number;
  total_pasiva_usd?: number;
  difference_usd?: number;
}

export interface BalanceReportMeta {
  company_id?: number;
  period_start?: string;
  period_end?: string;
  year?: number;
  month?: string | null;
  generated_at?: string;
}

export interface BalanceCategoryCalc {
  total: number;
  total_usd?: number;
  accounts: BalanceAccountItem[];
}

export interface BalanceReportSummary {
  opening_balance?: number | string | null;
  ending_balance?: number | string | null;
  total_current_assets?: number;
  total_fixed_assets_gross?: number;
  total_accumulated_depreciation?: number;
  total_fixed_assets?: number;
  total_aktiva?: number;
  total_liabilities?: number;
  total_modal_awal?: number;
  total_laba_ditahan?: number;
  laba_periode_berjalan?: number;
  total_modal?: number;
  total_pasiva?: number;
  difference?: number;
  is_balance?: boolean;
  status_balance?: string;
  [key: string]: unknown;
}

export interface BalanceReportData {
  year?: number;
  month?: string | null;
  period_start?: string;
  period_end?: string;
  sections?: BalanceSheetSections;
  subtotals?: BalanceSheetSubtotals;
  summary?: BalanceReportSummary;
  meta?: BalanceReportMeta;

  // Registered account IDs
  current_asset_account_ids?: number[];
  fixed_asset_account_ids?: number[];
  liability_account_ids?: number[];
  equity_account_ids?: number[];

  // Calculation details per category (legacy/backward compatibility)
  current_asset_calc?: BalanceCategoryCalc;
  fixed_asset_calc?: BalanceCategoryCalc;
  liability_calc?: BalanceCategoryCalc;
  equity_calc?: BalanceCategoryCalc;

  // Totals
  total_current_assets?: number;
  total_fixed_assets?: number;
  total_assets?: number;
  total_assets_usd?: number;
  total_liabilities?: number;
  total_liabilities_usd?: number;
  total_equity?: number;
  total_equity_usd?: number;
  total_passiva?: number;
  total_passiva_usd?: number;

  [key: string]: unknown;
}

export interface BalanceReportResponse {
  status?: boolean;
  message?: string;
  errors?: unknown;
  data?: BalanceReportData;
}

export interface BalanceReportFilterParams {
  year?: number | string | null;
  month?: string | number | null;
  start_date?: string | null;
  end_date?: string | null;
  date?: string | null;
  category?: string | null;
  account_id?: number | null;
  account_name?: string | null;
  account_code?: string | null;
  search?: string | null;
  transaction_filter?: 'accounts' | 'account_with_transactions' | string | null;
}

export type BalanceReportFilters = BalanceReportFilterParams;

// ==========================================
// Legacy Types (Preserved for compatibility)
// ==========================================
export type BalanceReportTemplateType = 'assets' | 'liabilities';

export type LegacyBalanceReportTemplateKey =
  | 'receivable_ids'
  | 'down_payment_ids'
  | 'fixed_asset_ids'
  | 'accounts_payable_ids'
  | 'tax_payable_ids'
  | 'miscellaneous_debts_ids'
  | 'equity_ids';

export interface BalanceReportTemplatePayload {
  type?: BalanceReportTemplateType;
  receivable_ids?: number[];
  down_payment_ids?: number[];
  fixed_asset_ids?: number[];
  accounts_payable_ids?: number[];
  tax_payable_ids?: number[];
  miscellaneous_debts_ids?: number[];
  equity_ids?: number[];
  current_asset_account_ids?: number[];
  liability_account_ids?: number[];
  year?: number;
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

export type BalanceReportAccountLine = BalanceAccountItem;

export interface BalanceReportCalcSection {
  total: number | string;
  total_idr?: number | string | null;
  total_usd?: number | string | null;
  accounts?: BalanceAccountItem[];
  items?: BalanceReportCashCalcItem[];
}

export interface BalanceReportCashListResponse {
  status?: boolean;
  message?: string;
  errors?: unknown;
  data?: Kas[];
}
