/**
 * Dashboard Type Definitions
 * Type-safe interfaces untuk semua data structures pada dashboard
 */

export type Currency = 'IDR' | 'USD';
export type TrendDirection = 'up' | 'down';

/**
 * KPI (Key Performance Indicator) Data Structure
 */
export interface KpiData {
  id: string;
  title: string;
  value: number;
  currency: Currency;
  trend: TrendDirection;
  trendPercentage: number;
  trendLabel: string;
}

/**
 * Monthly Revenue Data untuk Bar Chart
 */
export interface MonthlyRevenueData {
  month: string;
  bcaIdr: number;
  bcaUsd: number;
  cash: number;
}

/**
 * Income Breakdown Data untuk Donut Chart
 */
export interface IncomeBreakdownData {
  category: string;
  value: number;
  percentage: number;
  color: string;
}

/**
 * Financial account summary (for the top cards)
 */
export interface AccountOverview {
  id: string;
  name: string;
  subtitle: string;
  currency: Currency;
  type: 'bank' | 'cash';
  openingBalance: number;
  debit: number;
  credit: number;
  closingBalance: number;
  accentColor: string;
}

/**
 * Finance series values per account source
 */
export interface FinanceSeriesValues {
  bcaUsd: number;
  bcaIdr: number;
  cash: number;
}

/**
 * Finance series per transaction type (sales / purchase)
 * Supports both flat structure (backward compat) and nested structure
 */
export interface FinanceSeriesByType extends FinanceSeriesValues {
  /** Optional nested breakdown by transaction type */
  sales?: FinanceSeriesValues;
  purchase?: FinanceSeriesValues;
}

/**
 * Monthly finance series (supports income & expense toggle + sales/purchase filter)
 *
 * Backward compatible:
 * - Old shape: item.income.bcaUsd
 * - New shape: item.income.sales.bcaUsd / item.income.purchase.bcaUsd
 */
export interface FinanceSeriesPoint {
  month: string;
  income: FinanceSeriesByType;
  expense: FinanceSeriesByType;
}

/**
 * Customer overview block
 */
export interface CustomerOverview {
  totalCustomers: number;
  totalRevenue: {
    idr: number;
    usd: number;
  };
  averageRevenue: number;
  topCustomers: Array<{ name: string; revenue: number }>;
}

/**
 * Product overview block
 */
export interface ProductOverview {
  totalProducts: number;
  totalSold: number;
  totalSoldActual?: number;
  totalSoldForecast?: number;
  topProducts: Array<{
    name: string;
    brandName?: string;
    quantity: number;
    actual?: number;
    forecast?: number;
    totalProducts?: number;
  }>;
}

/**
 * Cashflow summary section
 */
export interface CashflowSummaryItem {
  account: string;
  amount: number;
  currency: Currency;
}

export interface CashflowSummary {
  incomes: CashflowSummaryItem[];
  outcomes: CashflowSummaryItem[];
}

/**
 * Transaction detail table row
 */
export interface TransactionEntry {
  note: string;
  date: string;
  sale: string;
  customer: string;
  account: string;
  total: number;
  currency: Currency;
  description: string;
  type: 'income' | 'expense';
}

/**
 * Complete Dashboard API Response
 */
export interface DashboardApiResponse {
  kpis: KpiData[];
  monthlyRevenue: MonthlyRevenueData[];
  incomeBreakdown: IncomeBreakdownData[];
  accounts: AccountOverview[];
  financeSeries: FinanceSeriesPoint[];
  customers: CustomerOverview;
  products: ProductOverview;
  cashflow: CashflowSummary;
  transactions: TransactionEntry[];
  lastUpdated: string;
}

/**
 * Dashboard Statistics Summary
 */
export interface DashboardStats {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyGrowth: number;
}

/**
 * Billing Stats API Response Raw Data
 */
export interface BillingStatsRaw {
  opening_balance: {
    debet: { cash?: number; cash_idr?: number; bca_idr: number; bca_usd: number };
    kredit?: { cash?: number; cash_idr?: number; bca_idr: number; bca_usd: number };
  };
  mutation: {
    debet: { cash?: number; cash_idr?: number; bca_idr: number; bca_usd: number };
    kredit: { cash?: number; cash_idr?: number; bca_idr: number; bca_usd: number };
  };
  percentage?: Array<{
    date: string;
    debet: { cash?: number; cash_idr?: number; bca_idr: number; bca_usd: number };
    kredit: { cash?: number; cash_idr?: number; bca_idr: number; bca_usd: number };
    debet_percentage?: { cash?: number; cash_idr?: number; bca_idr: number; bca_usd: number };
    kredit_percentage?: { cash?: number; cash_idr?: number; bca_idr: number; bca_usd: number };
  }>;
}

/**
 * Customer Stats API Response Raw Data
 */
export interface CustomerStatsRaw {
  summary: {
    total_customer: number;
    total_revenue: number;
    average_revenue_per_customer: number;
  };
  customers: {
    current_page: number;
    data: any[];
    total: number;
    last_page?: number;
    per_page?: number;
  };
}

/**
 * Product Stats API Response Raw Data
 */
export interface ProductStatsRaw {
  summary: {
    total_unit_type: number;
    total_unit_type_sold: number;
  };
  data: {
    current_page: number;
    data: any[];
    total: number;
    last_page?: number;
    per_page?: number;
  };
}

/**
 * Transaction Unit API Response Raw Data
 */
export interface TransactionStatsRaw {
  current_page: number;
  data: any[];
  first_page_url?: string;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export type ProductTransactionMetric = {
  sales_transaction_count: number;
  purchase_transaction_count: number;
  sales_qty: number;
  purchase_qty: number;
  sales_amount: number;
  purchase_amount: number;
};

export type ProductTransactionSummary = ProductTransactionMetric & {
  product_type: 'unit_type' | 'sparepart';
  total_products: number;
  transacted_products: number;
};

export type ProductTransactionTrendPoint = ProductTransactionMetric & {
  label: string;
  product_type: 'unit_type' | 'sparepart';
};

export type ProductTrendPoint = ProductTransactionMetric & { label: string };

export type ProductTransactionTrend = {
  product_type: 'unit_type' | 'sparepart';
  product_id: number;
  product_name: string;
  group_name: string;
  trend: ProductTrendPoint[];
  total_sales_transactions?: number;
  total_purchase_transactions?: number;
};

export interface ProductTransactionOverviewResponse {
  summary: {
    total: ProductTransactionMetric;
    by_product_type: ProductTransactionSummary[];
  };
  transaction_trend: ProductTransactionTrendPoint[];
  product_trend: ProductTransactionTrend[];
}
