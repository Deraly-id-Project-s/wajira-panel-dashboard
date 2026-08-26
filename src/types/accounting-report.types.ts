export type AccountingReportTab =
  | 'profit-loss'
  | 'balance-sheet'
  | 'vat-input-monthly'
  | 'vat-output-monthly'
  | 'vat-yearly';

export interface AccountingReportParams {
  companySlug?: string;
  companyName: string;
  periodDate: string;
}

export interface AccountingReportLineItem {
  label: string;
  value?: number | null;
  indent?: number;
  bold?: boolean;
  muted?: boolean;
}

export interface AccountingReportBox {
  title?: string;
  rows: AccountingReportLineItem[];
  totalLabel?: string;
  totalValue?: number | null;
  totalTone?: 'default' | 'soft';
}

export interface ProfitLossReport {
  companyName: string;
  reportTitle: string;
  periodLabel: string;
  revenueBox: AccountingReportBox;
  costOfGoodsSoldBox: AccountingReportBox;
  grossProfit: number | null;
  expenseBox: AccountingReportBox;
  operatingIncome: number | null;
  nonOperatingBox: AccountingReportBox;
  incomeBeforeTax: number | null;
  fiscalCorrectionBox: AccountingReportBox;
  incomeBeforeTaxAfterCorrection: number | null;
  tax: number | null;
  netIncomeAfterTax: number | null;
  placeAndDate: string;
  directorName: string;
  directorTitle: string;
}

export interface BalanceSheetSection {
  title: string;
  rows: AccountingReportLineItem[];
  totalLabel?: string;
  totalValue?: number | null;
}

export interface BalanceSheetDocument {
  label: string;
  sections: BalanceSheetSection[];
  totalLabel: string;
  totalValue: number | null;
}

export interface BalanceSheetReport {
  companyName: string;
  reportTitle: string;
  periodLabel: string;
  assets: BalanceSheetDocument;
  liabilities: BalanceSheetDocument;
  placeAndDate: string;
  directorName: string;
  directorTitle: string;
}

export interface MonthlyVatReportRow {
  transactionDate: string;
  partnerName: string;
  invoiceDate: string;
  taxInvoiceNumber: string;
  unitType: string;
  engineNumber: string;
  frameNumber: string;
  purchasePrice: number;
  fee: number;
  unitPrice: number;
  dpp: number;
  vat: number;
}

export interface MonthlyVatReportTotals {
  purchasePrice: number;
  fee: number;
  unitPrice: number;
  dpp: number;
  vat: number;
}

export interface MonthlyVatReport {
  companyName: string;
  reportTitle: string;
  periodLabel: string;
  rows: MonthlyVatReportRow[];
  totals: MonthlyVatReportTotals;
}

export interface YearlyVatReportRow {
  masa: string;
  inputPurchasePrice: number;
  inputDpp: number;
  inputVat: number;
  outputSalesPrice: number;
  outputDpp: number;
  outputVat: number;
  saldoPpn: number;
  paymentStatus: string;
}

export interface YearlyVatReportTotals {
  inputPurchasePrice: number;
  inputDpp: number;
  inputVat: number;
  outputSalesPrice: number;
  outputDpp: number;
  outputVat: number;
  saldoPpn: number;
}

export interface YearlyVatReport {
  companyName: string;
  reportTitle: string;
  periodLabel: string;
  rows: YearlyVatReportRow[];
  totals: YearlyVatReportTotals;
}
