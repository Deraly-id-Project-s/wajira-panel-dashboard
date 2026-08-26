'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import {
  AccountingReportParams,
  AccountingReportTab,
  BalanceSheetReport,
  MonthlyVatReport,
  ProfitLossReport,
  YearlyVatReport,
} from '@/types/accounting-report.types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import {
  downloadAccountingReport,
  getAccountingBalanceSheetReport,
  getAccountingProfitLossReport,
  getMonthlyVatInputReport,
  getMonthlyVatOutputReport,
  getYearlyVatReport,
} from '@/services/laporan-akuntansi.service';

import AccountingReportFilters from './AccountingReportFilters';
import AccountingReportTabs from './AccountingReportTabs';
import {
  formatAccountingPeriodQuery,
  getAccountingCompanyName,
  getAccountingReportTab,
  parseAccountingPeriod,
} from './laporan-akuntansi.utils';
import BalanceSheetReportView from './BalanceSheetReportView';
import MonthlyVatReportView from './MonthlyVatReportView';
import ProfitLossReportView from './ProfitLossReportView';
import YearlyVatReportView from './YearlyVatReportView';

type ReportState =
  | { tab: 'profit-loss'; data: ProfitLossReport }
  | { tab: 'balance-sheet'; data: BalanceSheetReport }
  | { tab: 'vat-input-monthly'; data: MonthlyVatReport }
  | { tab: 'vat-output-monthly'; data: MonthlyVatReport }
  | { tab: 'vat-yearly'; data: YearlyVatReport }
  | null;

async function loadAccountingReport(
  tab: AccountingReportTab,
  params: AccountingReportParams,
): Promise<ReportState> {
  switch (tab) {
    case 'profit-loss':
      return { tab, data: await getAccountingProfitLossReport(params) };
    case 'balance-sheet':
      return { tab, data: await getAccountingBalanceSheetReport(params) };
    case 'vat-input-monthly':
      return { tab, data: await getMonthlyVatInputReport(params) };
    case 'vat-output-monthly':
      return { tab, data: await getMonthlyVatOutputReport(params) };
    case 'vat-yearly':
      return { tab, data: await getYearlyVatReport(params) };
    default:
      return null;
  }
}

function LoadingState() {
  return (
    <div className="rounded-[28px] border border-[#e5e7eb] bg-white p-8 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
      <div className="space-y-4 animate-pulse">
        <div className="mx-auto h-6 w-72 rounded-full bg-[#e5e7eb]" />
        <div className="mx-auto h-5 w-52 rounded-full bg-[#e5e7eb]" />
        <div className="mx-auto h-5 w-40 rounded-full bg-[#e5e7eb]" />
        <div className="mt-10 h-72 rounded-[24px] bg-[#f3f4f6]" />
      </div>
    </div>
  );
}

export default function AccountingReportPage() {
  const router = useRouter();

  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const companyName = useMemo(() => getAccountingCompanyName(slug), [slug]);

  const [activeTab, setActiveTab] = useState<AccountingReportTab>('profit-loss');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2025, 0, 20));
  const [appliedDate, setAppliedDate] = useState<Date>(new Date(2025, 0, 20));
  const [reportState, setReportState] = useState<ReportState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const nextTab = getAccountingReportTab(
      typeof router.query.tab === 'string' ? router.query.tab : null,
    );

    setActiveTab(nextTab);
  }, [router.isReady, router.query.tab]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const nextDate = parseAccountingPeriod(router.query.period);

    setSelectedDate(nextDate);
    setAppliedDate(nextDate);
  }, [router.isReady, router.query.period]);

  useEffect(() => {
    const params: AccountingReportParams = {
      companySlug: slug,
      companyName,
      periodDate: formatAccountingPeriodQuery(appliedDate),
    };

    let isCancelled = false;
    setIsLoading(true);

    void loadAccountingReport(activeTab, params)
      .then((result) => {
        if (!isCancelled) {
          setReportState(result);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          toast.error('Gagal memuat laporan akuntansi.');
          setReportState(null);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activeTab, appliedDate, companyName, slug]);

  const syncQuery = (tab: AccountingReportTab, periodDate: Date) => {
    const nextQuery = {
      ...router.query,
      tab,
      period: formatAccountingPeriodQuery(periodDate),
    };

    void router.replace(
      {
        pathname: router.pathname,
        query: nextQuery,
      },
      undefined,
      { shallow: true },
    );
  };

  const handleTabChange = (tab: AccountingReportTab) => {
    setActiveTab(tab);
    syncQuery(tab, appliedDate);
  };

  // Trigger filter automatically when selectedDate changes
  useEffect(() => {
    if (selectedDate.getTime() !== appliedDate.getTime()) {
      setAppliedDate(selectedDate);
      syncQuery(activeTab, selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, activeTab, appliedDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await downloadAccountingReport({
        companySlug: slug,
        companyName,
        periodDate: formatAccountingPeriodQuery(appliedDate),
      });

      if (response.success) {
        toast.success(`Dummy download siap: ${response.fileName}`);
      }
    } catch {
      toast.error('Gagal menyiapkan file laporan.');
    } finally {
      setIsDownloading(false);
    }
  };

  const renderActiveReport = () => {
    if (!reportState) {
      return null;
    }

    switch (reportState.tab) {
      case 'profit-loss':
        return <ProfitLossReportView report={reportState.data} />;
      case 'balance-sheet':
        return <BalanceSheetReportView report={reportState.data} />;
      case 'vat-input-monthly':
      case 'vat-output-monthly':
        return <MonthlyVatReportView report={reportState.data} />;
      case 'vat-yearly':
        return <YearlyVatReportView report={reportState.data} />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="no-print">
          <PageHeader
            title="Laporan Akuntansi"
            subtitle="Pantau semua pemasukan dan pengeluaran"
          />
        </div>

        <div className="space-y-4">
          <AccountingReportFilters
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onPrint={handlePrint}
            onDownload={handleDownload}
            isDownloading={isDownloading}
          />

          <AccountingReportTabs activeTab={activeTab} onChange={handleTabChange} />

          <div className="print:pt-0">
            {isLoading ? <LoadingState /> : renderActiveReport()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
