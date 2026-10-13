export type ProfitLossTemplateKey =
  | 'revenue_account_ids'
  | 'cogs_account_ids'
  | 'opex_account_ids';

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

export type MonthlyAccounts = Record<MonthKey, number[]>;

export interface ProfitLossYearConfig {
  revenue_account_ids: MonthlyAccounts;
  cogs_account_ids: MonthlyAccounts;
  opex_account_ids: MonthlyAccounts;
  gross_profit_account_ids?: MonthlyAccounts;
  noix_account_ids?: MonthlyAccounts;
  tax?: number | null;
}

export interface ProfitLossTemplateYearItem {
  id: number;
  profit_template_id: number;
  year: number;
  config: ProfitLossYearConfig;
  created_at?: string;
  updated_at?: string;
}

export interface ProfitLossTemplateEntity {
  id: number;
  company_id: number;
  profit_loss_template_years?: ProfitLossTemplateYearItem[];
  created_at?: string;
  updated_at?: string;
}

export interface ProfitLossTemplateResponse {
  status?: boolean;
  message?: string;
  errors?: unknown;
  data?: {
    template: ProfitLossTemplateEntity;
    default_structure: ProfitLossYearConfig;
  };
}

export interface ProfitLossTemplateYearResponse {
  status?: boolean;
  message?: string;
  errors?: unknown;
  data?: ProfitLossTemplateYearItem;
}

export interface SaveProfitLossTemplateYearPayload {
  year?: number;
  tax?: number | null;
  revenue_account_ids?: Partial<MonthlyAccounts>;
  cogs_account_ids?: Partial<MonthlyAccounts>;
  gross_profit_account_ids?: Partial<MonthlyAccounts>;
  opex_account_ids?: Partial<MonthlyAccounts>;
  noix_account_ids?: Partial<MonthlyAccounts>;
  config?: Partial<ProfitLossYearConfig>;
}

export interface ProfitLossTemplatePayload {
  revenue_account_ids: number[];
  cogs_account_ids: number[];
  gross_profit_account_ids?: number[];
  opex_account_ids: number[];
  noix_account_ids?: number[];
  tax?: number | string | null;
  year?: number;
}

export interface ProfitLossReportFilters {
  start_date?: string | null;
  end_date?: string | null;
  year?: number | string | null;
  month?: string | number | null;
  category?: string | null;
}

export interface ProfitLossReportLine {
  id?: string | number | null;
  account_id?: string | number | null;
  account_code?: string | null;
  account_name?: string | null;
  account_type?: string | null;
  code?: string | null;
  name?: string | null;
  label?: string | null;
  amount?: number | string | null;
  amount_usd?: number | string | null;
  debit?: number | string | null;
  debit_usd?: number | string | null;
  credit?: number | string | null;
  credit_usd?: number | string | null;
  total?: number | string | null;
  total_usd?: number | string | null;
  value?: number | string | null;
  value_usd?: number | string | null;
  balance?: number | string | null;
  balance_usd?: number | string | null;
  type?: 'IDR' | 'USD' | string | null;
}

export interface ProfitLossReportSection {
  accounts?: ProfitLossReportLine[];
  rows?: ProfitLossReportLine[];
  items?: ProfitLossReportLine[];
  data?: ProfitLossReportLine[];
  total?: number | string | null;
  total_usd?: number | string | null;
  amount?: number | string | null;
  amount_usd?: number | string | null;
  value?: number | string | null;
  value_usd?: number | string | null;
}

export interface ProfitLossReportData {
  revenue?: ProfitLossReportSection | ProfitLossReportLine[];
  cogs?: ProfitLossReportSection | ProfitLossReportLine[];
  gross_profit?: ProfitLossReportSection | ProfitLossReportLine[] | number | string | null;
  opex?: ProfitLossReportSection | ProfitLossReportLine[];
  noix?: ProfitLossReportSection | ProfitLossReportLine[];
  tax?: number | string | null;
  tax_percentage?: number | string | null;
  tax_amount?: number | string | null;
  tax_amount_usd?: number | string | null;
  revenue_calc?: ProfitLossReportSection;
  cogs_calc?: ProfitLossReportSection;
  gross_calc?: ProfitLossReportSection;
  opex_calc?: ProfitLossReportSection;
  noix_calc?: ProfitLossReportSection;
  summary?: {
    opening_balance?: number | string | null;
    ending_balance?: number | string | null;
    opening_balance_usd?: number | string | null;
    ending_balance_usd?: number | string | null;
  };
  revenue_account_ids?: number[];
  cogs_account_ids?: number[];
  gross_profit_account_ids?: number[];
  opex_account_ids?: number[];
  noix_account_ids?: number[];
  profit_loss_before_tax?: number | string | null;
  profit_loss_before_tax_usd?: number | string | null;
  profit_loss_after_tax?: number | string | null;
  profit_loss_after_tax_usd?: number | string | null;
  net_income?: number | string | null;
  net_income_usd?: number | string | null;
  net_profit?: number | string | null;
  net_profit_usd?: number | string | null;
  profit_loss?: number | string | null;
  profit_loss_usd?: number | string | null;
  template?: Partial<ProfitLossTemplatePayload>;
  [key: string]: unknown;
}

export interface ProfitLossReportResponse {
  status?: boolean;
  message?: string;
  errors?: unknown;
  data?: ProfitLossReportData;
}
