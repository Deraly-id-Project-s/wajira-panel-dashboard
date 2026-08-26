/**
 * Dashboard Validation Schemas
 * Zod schemas untuk runtime validation dan type inference
 */

import { z } from 'zod';

/**
 * KPI Data Schema
 */
export const kpiDataSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  value: z.number().nonnegative(),
  currency: z.enum(['IDR', 'USD']),
  trend: z.enum(['up', 'down']),
  trendPercentage: z.number().min(0).max(100),
  trendLabel: z.string(),
});

/**
 * Monthly Revenue Schema
 */
export const monthlyRevenueSchema = z.object({
  month: z.string().regex(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/),
  bcaIdr: z.number().nonnegative(),
  bcaUsd: z.number().nonnegative(),
  cash: z.number().nonnegative(),
});

/**
 * Income Breakdown Schema
 */
export const incomeBreakdownSchema = z.object({
  category: z.string().min(1),
  value: z.number().nonnegative(),
  percentage: z.number().min(0).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/), // Hex color validation
});

/**
 * Account overview schema (top cards)
 */
export const accountOverviewSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  subtitle: z.string().min(1),
  currency: z.enum(['IDR', 'USD']),
  type: z.enum(['bank', 'cash']),
  openingBalance: z.number(),
  debit: z.number(),
  credit: z.number(),
  closingBalance: z.number(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

/**
 * Finance series schema (line chart toggle income/expense)
 */
const accountSeriesValuesSchema = z.object({
  bcaUsd: z.number().nonnegative(),
  bcaIdr: z.number().nonnegative(),
  cash: z.number().nonnegative(),
});

/** Supports both flat (legacy) and nested sales/purchase breakdown */
const accountSeriesByTypeSchema = accountSeriesValuesSchema.extend({
  sales: accountSeriesValuesSchema.optional(),
  purchase: accountSeriesValuesSchema.optional(),
});

export const financeSeriesSchema = z.object({
  month: z.string().min(1),
  income: accountSeriesByTypeSchema,
  expense: accountSeriesByTypeSchema,
});

/** Customer overview **/
export const customerOverviewSchema = z.object({
  totalCustomers: z.number().nonnegative(),
  totalRevenue: z.object({
    idr: z.number().nonnegative(),
    usd: z.number().nonnegative(),
  }),
  averageRevenue: z.number().nonnegative(),
  topCustomers: z.array(
    z.object({
      name: z.string().min(1),
      revenue: z.number().nonnegative(),
    }),
  ),
});

/** Product overview **/
export const productOverviewSchema = z.object({
  totalProducts: z.number().nonnegative(),
  totalSold: z.number().nonnegative(),
  topProducts: z.array(
    z.object({
      name: z.string().min(1),
      brandName: z.string().min(1),
      quantity: z.number().nonnegative(),
    }),
  ),
});

/** Cashflow summary **/
const cashflowItemSchema = z.object({
  account: z.string().min(1),
  amount: z.number(),
  currency: z.enum(['IDR', 'USD']),
});

export const cashflowSummarySchema = z.object({
  incomes: z.array(cashflowItemSchema),
  outcomes: z.array(cashflowItemSchema),
});

/** Transaction detail **/
export const transactionEntrySchema = z.object({
  note: z.string().min(1),
  date: z.string().datetime(),
  sale: z.string().min(1),
  customer: z.string().min(1),
  account: z.string().min(1),
  total: z.number(),
  currency: z.enum(['IDR', 'USD']),
  description: z.string().min(1),
  type: z.enum(['income', 'expense']),
});

/**
 * Complete Dashboard Response Schema
 */
export const dashboardResponseSchema = z.object({
  kpis: z.array(kpiDataSchema).min(1),
  monthlyRevenue: z.array(monthlyRevenueSchema).min(1),
  incomeBreakdown: z.array(incomeBreakdownSchema).min(1),
  accounts: z.array(accountOverviewSchema).min(1),
  financeSeries: z.array(financeSeriesSchema).min(1),
  customers: customerOverviewSchema,
  products: productOverviewSchema,
  cashflow: cashflowSummarySchema,
  transactions: z.array(transactionEntrySchema).min(1),
  lastUpdated: z.string().datetime(),
});

/**
 * Type inference dari schemas
 */
export type KpiDataInput = z.infer<typeof kpiDataSchema>;
export type MonthlyRevenueInput = z.infer<typeof monthlyRevenueSchema>;
export type IncomeBreakdownInput = z.infer<typeof incomeBreakdownSchema>;
export type DashboardResponseInput = z.infer<typeof dashboardResponseSchema>;
export type AccountOverviewInput = z.infer<typeof accountOverviewSchema>;
export type FinanceSeriesInput = z.infer<typeof financeSeriesSchema>;
export type CustomerOverviewInput = z.infer<typeof customerOverviewSchema>;
export type ProductOverviewInput = z.infer<typeof productOverviewSchema>;
export type CashflowSummaryInput = z.infer<typeof cashflowSummarySchema>;
export type TransactionEntryInput = z.infer<typeof transactionEntrySchema>;
