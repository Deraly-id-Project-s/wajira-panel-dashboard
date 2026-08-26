import {
  AccountingReportParams,
  BalanceSheetReport,
  MonthlyVatReport,
  ProfitLossReport,
  YearlyVatReport,
} from '@/types/accounting-report.types';
import {
  getDummyBalanceSheetReport,
  getDummyMonthlyVatInputReport,
  getDummyMonthlyVatOutputReport,
  getDummyProfitLossReport,
  getDummyYearlyVatReport,
} from '@/components/features/laporan-akuntansi/laporan-akuntansi.dummy';

export async function getAccountingProfitLossReport(
  params: AccountingReportParams,
): Promise<ProfitLossReport> {
  return getDummyProfitLossReport(params);
}

export async function getAccountingBalanceSheetReport(
  params: AccountingReportParams,
): Promise<BalanceSheetReport> {
  return getDummyBalanceSheetReport(params);
}

export async function getMonthlyVatInputReport(
  params: AccountingReportParams,
): Promise<MonthlyVatReport> {
  return getDummyMonthlyVatInputReport(params);
}

export async function getMonthlyVatOutputReport(
  params: AccountingReportParams,
): Promise<MonthlyVatReport> {
  return getDummyMonthlyVatOutputReport(params);
}

export async function getYearlyVatReport(
  params: AccountingReportParams,
): Promise<YearlyVatReport> {
  return getDummyYearlyVatReport(params);
}

export async function downloadAccountingReport(
  params: AccountingReportParams,
): Promise<{ success: boolean; fileName: string }> {
  const safeCompany = params.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return {
    success: true,
    fileName: `${safeCompany}-${params.periodDate}.pdf`,
  };
}
