/**
 * Dashboard API Service
 * Service layer untuk semua dashboard-related API calls
 */

import { DashboardApiResponse, BillingStatsRaw, CustomerStatsRaw, ProductStatsRaw, TransactionStatsRaw, FinanceSeriesPoint, AccountOverview, CustomerOverview, ProductOverview, CashflowSummary, TransactionEntry } from '@/@types/dashboard';
import { apiClient } from './client';

export const dashboardService = {
  async getDashboardData(companyId: string, startDate?: string | null, endDate?: string | null): Promise<DashboardApiResponse> {
    const defaultParams: any = { company_id: companyId };
    if (startDate) defaultParams.start_date = startDate;
    if (endDate) defaultParams.end_date = endDate;

    const safeGet = async <T>(url: string, config: any, fallback: T): Promise<T> => {
      try {
        const response = await apiClient.get<{ status: boolean; data: T }>(url, config);
        return response.data.data;
      } catch (err) {
        console.warn(`[DashboardService] Failed to fetch from ${url}, using fallback:`, err);
        return fallback;
      }
    };

    // Fetch real data dari API secara paralel dengan penanganan error masing-masing
    const [stats, customerStats, productStats, transactionStats] = await Promise.all([
      safeGet<BillingStatsRaw>('/wapi/stats/billing-stats', { params: defaultParams }, {
        opening_balance: {
          debet: { bca_idr: 0, bca_usd: 0 },
          kredit: { bca_idr: 0, bca_usd: 0 }
        },
        mutation: {
          debet: { bca_idr: 0, bca_usd: 0 },
          kredit: { bca_idr: 0, bca_usd: 0 }
        },
        percentage: []
      }),
      safeGet<CustomerStatsRaw>('/wapi/stats/customer-stats', { params: defaultParams }, {
        summary: { total_customer: 0, total_revenue: 0, average_revenue_per_customer: 0 },
        customers: { current_page: 1, data: [], total: 0 }
      }),
      safeGet<ProductStatsRaw>('/wapi/stats/unit-type-stats', { params: defaultParams }, {
        summary: { total_unit_type: 0, total_unit_type_sold: 0 },
        data: { current_page: 1, data: [], total: 0 }
      }),
      safeGet<TransactionStatsRaw>('/wapi/transaction/unit-transaction/unit-transaction', {
        params: {
          sort_order: 'desc',
          per_page: 5,
          page: 1,
          is_paid: true,
          ...defaultParams,
        },
      }, {
        current_page: 1,
        data: [],
        total: 0
      })
    ]);

    // Transform ke AccountOverview
    const accounts = dashboardService.transformToAccounts(stats);

    // Generate chart data dari mutation total
    const financeSeries = dashboardService.generateChartData(stats);

    // Mapping Transaction
    const transactions: TransactionEntry[] = (transactionStats.data || []).map((t: any) => {
      let account = 'Unknown';
      const history = t.unit_transaction_billing?.unit_transaction_billing_histories?.[0];
      if (history) {
        if (history.bca_payment_amount > 0 || history.bca_payment_usd_amount > 0) {
          account = 'BCA';
        } else if (history.cash_payment_amount > 0) {
          account = 'CASH';
        }
      }

      return {
        note: t.code || '-',
        date: t.created_at || new Date().toISOString(),
        sale: t.type === 'purchase' ? 'Pembelian' : 'Penjualan',
        customer: t.person?.name || '-',
        account: account,
        total: t.billing_summary?.grand_total || 0,
        currency: 'IDR',
        description: t.unit_transaction_item_counts ? `${t.unit_transaction_item_counts} Unit` : '-',
        type: t.type === 'purchase' ? 'expense' : 'income'
      };
    });

    // Mapping dari customer response
    const customers: CustomerOverview = {
      totalCustomers: customerStats.summary?.total_customer || 0,
      totalRevenue: {
        idr: customerStats.summary?.total_revenue || 0,
        usd: 0 // Tidak tersedia di API, default 0
      },
      averageRevenue: customerStats.summary?.average_revenue_per_customer || 0,
      topCustomers: (customerStats.customers?.data || []).map((c: any) => ({
        name: c.name || c.customer_name || 'Unknown',
        revenue: c.total_revenue || c.revenue || 0,
      }))
    };

    // Mapping dari product response
    const rawProducts = productStats.data?.data || [];
    const totalSoldSum = rawProducts.reduce((acc: number, curr: any) => acc + (curr.total_sold ?? 0), 0);
    const totalActualSum = rawProducts.reduce((acc: number, curr: any) => acc + (curr.total_sold_actual ?? 0), 0);
    const totalForecastSum = rawProducts.reduce((acc: number, curr: any) => acc + (curr.total_sold_forecast ?? 0), 0);

    const products: ProductOverview = {
      totalProducts: productStats.summary?.total_unit_type || rawProducts.length || 0,
      totalSold: totalSoldSum || productStats.summary?.total_unit_type_sold || 0,
      totalSoldActual: totalActualSum,
      totalSoldForecast: totalForecastSum,
      topProducts: rawProducts.map((p: any) => ({
        name: p.unit_type_name || p.name || 'Unknown',
        brandName: p.unit_type_brand_name || '-',
        quantity: p.total_sold ?? 0,
        actual: p.total_sold_actual ?? 0,
        forecast: p.total_sold_forecast ?? 0,
        totalProducts: p.total_products ?? 0,
      }))
    };
    const kpis: any[] = [];
    const monthlyRevenue: any[] = [];
    const incomeBreakdown: any[] = [];
    const cashflow: CashflowSummary = { incomes: [], outcomes: [] };

    return {
      kpis,
      monthlyRevenue,
      incomeBreakdown,
      accounts,
      financeSeries,
      customers,
      products,
      cashflow,
      transactions,
      lastUpdated: new Date().toISOString()
    };
  },

  transformToAccounts(stats: BillingStatsRaw): AccountOverview[] {
    if (!stats || !stats.opening_balance || !stats.mutation) {
      return [];
    }
    const { opening_balance, mutation } = stats;

    const openingBcaUsd = opening_balance.debet.bca_usd || 0;
    const mutationDebetBcaUsd = mutation.debet.bca_usd || 0;
    const mutationKreditBcaUsd = mutation.kredit.bca_usd || 0;

    const openingBcaIdr = opening_balance.debet.bca_idr || 0;
    const mutationDebetBcaIdr = mutation.debet.bca_idr || 0;
    const mutationKreditBcaIdr = mutation.kredit.bca_idr || 0;

    const openingCash = opening_balance.debet.cash_idr ?? opening_balance.debet.cash ?? 0;
    const mutationDebetCash = mutation.debet.cash_idr ?? mutation.debet.cash ?? 0;
    const mutationKreditCash = mutation.kredit.cash_idr ?? mutation.kredit.cash ?? 0;

    return [
      {
        id: 'bca_usd',
        name: 'BCA USD',
        subtitle: 'Bank BCA Dollar',
        type: 'bank',
        currency: 'USD',
        openingBalance: openingBcaUsd,
        debit: mutationDebetBcaUsd,
        credit: mutationKreditBcaUsd,
        closingBalance: openingBcaUsd + mutationDebetBcaUsd - mutationKreditBcaUsd,
        accentColor: '#2563eb'
      },
      {
        id: 'bca_idr',
        name: 'BCA IDR',
        subtitle: 'Bank BCA Rupiah',
        type: 'bank',
        currency: 'IDR',
        openingBalance: openingBcaIdr,
        debit: mutationDebetBcaIdr,
        credit: mutationKreditBcaIdr,
        closingBalance: openingBcaIdr + mutationDebetBcaIdr - mutationKreditBcaIdr,
        accentColor: '#dc2626'
      },
      {
        id: 'cash',
        name: 'CASH IDR',
        subtitle: 'Saldo Kas Tunai',
        type: 'cash',
        currency: 'IDR',
        openingBalance: openingCash,
        debit: mutationDebetCash,
        credit: mutationKreditCash,
        closingBalance: openingCash + mutationDebetCash - mutationKreditCash,
        accentColor: '#16a34a'
      },
    ];
  },

  generateChartData(stats: BillingStatsRaw): FinanceSeriesPoint[] {
    if (!stats) {
      return [];
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const formatDateLabel = (dateStr: string) => {
      const parts = dateStr.split('-');
      if (parts.length < 3) return dateStr;
      const day = parseInt(parts[2], 10);
      const monthNum = parseInt(parts[1], 10);
      if (isNaN(day) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) return dateStr;
      return `${day} ${monthsShort[monthNum - 1]}`;
    };

    // Jika response API memiliki data `percentage` harian, tampilkan per tanggal/hari
    if (stats.percentage && Array.isArray(stats.percentage) && stats.percentage.length > 0) {
      let percentageItems = stats.percentage;

      // Jika hanya terdapat 1 data (misal untuk hari ini saja), buat data dummy kemarin dan besok dengan nilai 0
      // agar membentuk grafik gunung (peak)
      if (percentageItems.length === 1) {
        const singleItem = percentageItems[0];
        const parts = singleItem.date.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);

          const singleDate = new Date(y, m, d);

          const yesterday = new Date(singleDate);
          yesterday.setDate(singleDate.getDate() - 1);

          const tomorrow = new Date(singleDate);
          tomorrow.setDate(singleDate.getDate() + 1);

          const formatDateString = (dt: Date) => {
            const year = dt.getFullYear();
            const month = String(dt.getMonth() + 1).padStart(2, '0');
            const day = String(dt.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };

          const zeroData = {
            cash_idr: 0,
            bca_idr: 0,
            bca_usd: 0
          };

          percentageItems = [
            {
              date: formatDateString(yesterday),
              debet: zeroData,
              kredit: zeroData,
              debet_percentage: zeroData,
              kredit_percentage: zeroData
            },
            singleItem,
            {
              date: formatDateString(tomorrow),
              debet: zeroData,
              kredit: zeroData,
              debet_percentage: zeroData,
              kredit_percentage: zeroData
            }
          ];
        }
      }

      // Urutkan item secara kronologis berdasarkan string tanggal YYYY-MM-DD
      const sortedPercentageItems = [...percentageItems].sort((a, b) => a.date.localeCompare(b.date));

      return sortedPercentageItems.map((item) => {
        const itemDebet = item.debet || {};
        const itemKredit = item.kredit || {};
        const debetBcaUsd = itemDebet.bca_usd || 0;
        const debetBcaIdr = itemDebet.bca_idr || 0;
        const debetCash = itemDebet.cash_idr ?? itemDebet.cash ?? 0;

        const kreditBcaUsd = itemKredit.bca_usd || 0;
        const kreditBcaIdr = itemKredit.bca_idr || 0;
        const kreditCash = itemKredit.cash_idr ?? itemKredit.cash ?? 0;

        return {
          month: formatDateLabel(item.date),
          income: {
            bcaUsd: debetBcaUsd,
            bcaIdr: debetBcaIdr,
            cash: debetCash,
            sales: {
              bcaUsd: debetBcaUsd,
              bcaIdr: debetBcaIdr,
              cash: debetCash,
            },
            purchase: {
              bcaUsd: 0,
              bcaIdr: 0,
              cash: 0,
            }
          },
          expense: {
            bcaUsd: kreditBcaUsd,
            bcaIdr: kreditBcaIdr,
            cash: kreditCash,
            sales: {
              bcaUsd: 0,
              bcaIdr: 0,
              cash: 0,
            },
            purchase: {
              bcaUsd: kreditBcaUsd,
              bcaIdr: kreditBcaIdr,
              cash: kreditCash,
            }
          }
        };
      });
    }

    // Fallback: Generate data secara sintetis menggunakan total mutation jika data `percentage` tidak tersedia
    if (!stats.mutation) {
      return [];
    }
    const { mutation } = stats;
    const currentMonth = new Date().getMonth() + 1; // Jan=1, Dec=12

    const totalCashDebit = mutation.debet.cash_idr ?? mutation.debet.cash ?? 0;
    const totalBcaIdrDebit = mutation.debet.bca_idr || 0;
    const totalBcaUsdDebit = mutation.debet.bca_usd || 0;
    const totalCashCredit = mutation.kredit.cash_idr ?? mutation.kredit.cash ?? 0;
    const totalBcaIdrCredit = mutation.kredit.bca_idr || 0;
    const totalBcaUsdCredit = mutation.kredit.bca_usd || 0;

    const salesRatio = 0.6;
    const purchaseRatio = 0.4;

    const series: FinanceSeriesPoint[] = [];

    for (let i = 0; i < currentMonth; i++) {
      const progress = (i + 1) / currentMonth;

      const cumulativeCashSales = totalCashDebit * salesRatio * progress;
      const cumulativeBcaIdrSales = totalBcaIdrDebit * salesRatio * progress;
      const cumulativeBcaUsdSales = totalBcaUsdDebit * salesRatio * progress;

      const cumulativeCashPurchase = totalCashCredit * purchaseRatio * progress;
      const cumulativeBcaIdrPurchase = totalBcaIdrCredit * purchaseRatio * progress;
      const cumulativeBcaUsdPurchase = totalBcaUsdCredit * purchaseRatio * progress;

      series.push({
        month: months[i],
        income: {
          bcaUsd: cumulativeBcaUsdSales,
          bcaIdr: cumulativeBcaIdrSales,
          cash: cumulativeCashSales,
          sales: {
            bcaUsd: cumulativeBcaUsdSales,
            cash: cumulativeCashSales,
            bcaIdr: cumulativeBcaIdrSales,
          },
          purchase: {
            cash: cumulativeCashPurchase,
            bcaIdr: cumulativeBcaIdrPurchase,
            bcaUsd: cumulativeBcaUsdPurchase,
          },
        },
        expense: {
          bcaUsd: cumulativeBcaUsdSales * 0.8,
          bcaIdr: cumulativeBcaIdrSales * 0.8,
          cash: cumulativeCashSales * 0.8,
          sales: {
            cash: cumulativeCashSales * 0.8,
            bcaIdr: cumulativeBcaIdrSales * 0.8,
            bcaUsd: cumulativeBcaUsdSales * 0.8,
          },
          purchase: {
            cash: cumulativeCashPurchase,
            bcaIdr: cumulativeBcaIdrPurchase,
            bcaUsd: cumulativeBcaUsdPurchase,
          },
        },
      });
    }

    return series;
  },

  async refreshDashboard(companyId: string, startDate?: string | null, endDate?: string | null): Promise<DashboardApiResponse> {
    return dashboardService.getDashboardData(companyId, startDate, endDate);
  },

  async getUnitTypeSalesTrend(params: {
    company_id?: string | number;
    warehouse_id?: string | number;
    unit_type_id?: string | number;
    range?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Array<{
    unit_type_id: number;
    unit_type_name: string;
    brand_name: string;
    trend: Array<{ label: string; total_sales: number }>;
  }>> {
    try {
      const response = await apiClient.get<{ status: boolean; data: any[] }>(
        '/wapi/stats/unit-transaction-sales-unit-type-trend',
        { params }
      );
      return response.data?.data || [];
    } catch (err) {
      console.warn('[DashboardService] Failed to fetch unit type sales trend:', err);
      return [];
    }
  },

  async getUnitTransactionTrend(params: {
    company_id?: string | number;
    start_date?: string | null;
    end_date?: string | null;
  }): Promise<{
    summary: {
      total_sales_transactions: number;
      total_purchase_transactions: number;
    };
    trend: Array<{ label: string; sales_count: number; purchase_count: number }>;
  }> {
    try {
      const response = await apiClient.get(
        '/wapi/stats/unit-transaction-trend',
        { params }
      );
      return response.data?.data || { summary: { total_sales_transactions: 0, total_purchase_transactions: 0 }, trend: [] };
    } catch (err) {
      console.warn('[DashboardService] Failed to fetch unit transaction trend:', err);
      return { summary: { total_sales_transactions: 0, total_purchase_transactions: 0 }, trend: [] };
    }
  },

  async refreshCache(companyId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ status: boolean; data: any }>(
        '/wapi/stats/refresh-cache',
        { params: { company_id: companyId } }
      );
      return response.data?.status === true;
    } catch (err) {
      console.warn('[DashboardService] Failed to refresh cache:', err);
      throw err;
    }
  },
};
