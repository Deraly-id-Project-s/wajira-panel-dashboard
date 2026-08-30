export type ProfitLossTemplateKey =
  | 'revenue_account_ids'
  | 'cogs_account_ids'
  | 'gross_profit_account_ids'
  | 'opex_account_ids'
  | 'noix_account_ids';

export interface ProfitLossTemplatePayload {
  revenue_account_ids: number[];
  cogs_account_ids: number[];
  gross_profit_account_ids: number[];
  opex_account_ids: number[];
  noix_account_ids: number[];
}

export interface ProfitLossReportLine {
  id?: string | number | null;
  account_id?: string | number | null;
  account_code?: string | null;
  account_name?: string | null;
  code?: string | null;
  name?: string | null;
  label?: string | null;
  amount?: number | string | null;
  total?: number | string | null;
  value?: number | string | null;
  balance?: number | string | null;
  type?: 'IDR' | 'USD' | string | null;
}

export interface ProfitLossReportSection {
  accounts?: ProfitLossReportLine[];
  rows?: ProfitLossReportLine[];
  items?: ProfitLossReportLine[];
  data?: ProfitLossReportLine[];
  total?: number | string | null;
  amount?: number | string | null;
  value?: number | string | null;
}

export interface ProfitLossReportData {
  revenue?: ProfitLossReportSection | ProfitLossReportLine[];
  cogs?: ProfitLossReportSection | ProfitLossReportLine[];
  gross_profit?: ProfitLossReportSection | ProfitLossReportLine[] | number | string | null;
  opex?: ProfitLossReportSection | ProfitLossReportLine[];
  noix?: ProfitLossReportSection | ProfitLossReportLine[];
  revenue_calc?: ProfitLossReportSection;
  cogs_calc?: ProfitLossReportSection;
  gross_calc?: ProfitLossReportSection;
  opex_calc?: ProfitLossReportSection;
  noix_calc?: ProfitLossReportSection;
  summary?: {
    opening_balance?: number | string | null;
    ending_balance?: number | string | null;
  };
  revenue_account_ids?: number[];
  cogs_account_ids?: number[];
  gross_profit_account_ids?: number[];
  opex_account_ids?: number[];
  noix_account_ids?: number[];
  profit_loss_before_tax?: number | string | null;
  net_income?: number | string | null;
  net_profit?: number | string | null;
  profit_loss?: number | string | null;
  template?: Partial<ProfitLossTemplatePayload>;
  [key: string]: unknown;
}

export interface ProfitLossReportResponse {
  status?: boolean;
  message?: string;
  errors?: unknown;
  data?: ProfitLossReportData;
}
