import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Download, Printer, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange, type DateRangePickerMode } from '@/components/ui/date-range-picker';
import { SearchPagination } from '@/components/ui/search-pagination';
import { ReportTemplatePrintDialog } from '@/components/ui/report-template-print-dialog';
import { ReportArchiveAction } from '@/components/features/report-archive/ReportArchiveAction';
import { LedgerAccountSelect } from '@/components/features/laporan-buku-besar/LedgerAccountSelect';
import { LaporanBukuBesarTable } from '@/components/features/laporan-buku-besar/LaporanBukuBesarTable';
import { LaporanBukuBesarPrintDocument } from '@/components/features/laporan-buku-besar/LaporanBukuBesarPrintDocument';
import { useLedgerReport } from '@/hooks/report/useLedgerReport';
import { useAccounts } from '@/hooks/useAccount';
import { useReportTemplatePrint } from '@/hooks/useReportTemplatePrint';
import type { LedgerReportParams, OpeningBalanceType } from '@/@types/ledger-report.types';
import { useCompany } from '@/contexts/CompanyContext';
import { getLetterheadByCompanyId, resolveCompanyId } from '@/lib/print-letterhead';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { exportLedgerReport } from '@/services/report/ledgerReport.service';

const getCompanyName = (companyId: number) => {
  if (companyId === 1) return 'PT WAJIRA JAGRATARA MORINDO';
  if (companyId === 3) return 'PT WAJIRA YANOTAMA';
  if (companyId === 4) return 'PT WAJIRA TRANSINDO';
  return 'PT WAJIRA';
};

export default function LaporanBukuBesarPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const resolvedCompanyId = resolveCompanyId(router.query.slug, companyId) || 1;
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);
  const templatePrint = useReportTemplatePrint(selectedPrintBackground);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dateMode, setDateMode] = useState<DateRangePickerMode>('month');
  const [sortBy, setSortBy] = useState('payment_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isExporting, setIsExporting] = useState(false);

  const accountQuery = useAccounts({
    page: 1,
    perPage: 1000,
    search: '',
    company_id: resolvedCompanyId,
    enabled: Boolean(resolvedCompanyId),
  });

  const accountOptions = useMemo(() => accountQuery.data?.data ?? [], [accountQuery.data?.data]);
  const selectedAccount = useMemo(
    () => accountOptions.find((account) => Number(account.id) === Number(selectedAccountId)) ?? null,
    [accountOptions, selectedAccountId],
  );

  // Sync selected account from URL query params (e.g. from Neraca, Neraca Lajur, or Laba Rugi)
  useEffect(() => {
    if (!router.isReady) return;

    const queryAccountId = router.query.account_id;
    const queryAccountCode = router.query.account_code;

    if (queryAccountId) {
      const parsedId = Number(queryAccountId);
      if (!Number.isNaN(parsedId) && parsedId > 0) {
        setSelectedAccountId(parsedId);
        setPage(1);
        return;
      }
    }

    if (queryAccountCode && accountOptions.length > 0) {
      const codeStr = String(queryAccountCode).trim().toLowerCase();
      const matched = accountOptions.find(
        (a) => (a.code || '').trim().toLowerCase() === codeStr,
      );
      if (matched) {
        setSelectedAccountId(Number(matched.id));
        setPage(1);
      }
    }
  }, [router.isReady, router.query.account_id, router.query.account_code, accountOptions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null;
  const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : startDate;

  const openingBalanceType: OpeningBalanceType = useMemo(() => {
    if (dateMode === 'date') return 'daily';
    if (dateMode === 'year') return 'yearly';
    return 'monthly';
  }, [dateMode]);

  const queryParams = useMemo<LedgerReportParams>(
    () => ({
      company_id: resolvedCompanyId,
      page,
      per_page: perPage,
      start_date: startDate,
      end_date: endDate,
      opening_balance_type: openingBalanceType,
      account_id: selectedAccountId,
      account_code: selectedAccount?.code ?? (typeof router.query.account_code === 'string' ? router.query.account_code : null),
      account_name: selectedAccount?.name ?? null,
      search: search || null,
      sort_by: sortBy,
      sort_order: sortOrder,
    }),
    [
      resolvedCompanyId,
      page,
      perPage,
      startDate,
      endDate,
      openingBalanceType,
      selectedAccountId,
      selectedAccount?.code,
      selectedAccount?.name,
      router.query.account_code,
      search,
      sortBy,
      sortOrder,
    ],
  );

  const { data, cashPosition, summary, pagination, isLoading } = useLedgerReport({
    ...queryParams,
    enabled: Boolean(resolvedCompanyId),
  });

  const handleSortChange = (key: string, direction: 'asc' | 'desc') => {
    setSortBy(key);
    setSortOrder(direction);
    setPage(1);
  };

  const handleReset = () => {
    setSelectedAccountId(null);
    setSearchInput('');
    setSearch('');
    setDateRange(undefined);
    setDateMode('month');
    setPage(1);
    if (router.query.account_id || router.query.account_code) {
      const { account_id, account_code, ...restQuery } = router.query;
      void router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true });
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportLedgerReport({
        ...queryParams,
        page: undefined,
        per_page: undefined,
      });
      toast.success('Laporan buku besar berhasil diexport');
    } catch (error: any) {
      toast.error(error?.message || 'Gagal export laporan buku besar');
    } finally {
      setIsExporting(false);
    }
  };

  const periodLabel = startDate
    ? `${dateRange?.from ? format(dateRange.from, 'dd MMM yyyy') : '-'}${endDate && endDate !== startDate && dateRange?.to ? ` – ${format(dateRange.to, 'dd MMM yyyy')}` : ''}`
    : 'Semua periode';
  const accountLabel = selectedAccount
    ? `${selectedAccount.code || '-'} · ${selectedAccount.name || '-'}`
    : 'Semua akun';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="no-print">
          <PageHeader
            title="Laporan Buku Besar"
            subtitle="Pantau mutasi akun dan posisi saldo berdasarkan periode pembayaran"
            actions={
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button onClick={handleExport} variant="outline" disabled={isExporting || isLoading}>
                  <Download className="mr-2 h-4 w-4" />
                  {isExporting ? 'Exporting...' : 'Export Excel'}
                </Button>
                <Button onClick={templatePrint.openPrintDialog} variant="outline" disabled={isLoading}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <ReportArchiveAction
                  reportTitle="Laporan Buku Besar"
                  archiveSourceLabel={`Buku Besar · ${accountLabel}`}
                  periodLabel={periodLabel}
                  data={data}
                  disabled={isLoading}
                />
              </div>
            }
          />
        </div>

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari data"
          filters={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-[220px]">
                <LedgerAccountSelect
                  value={selectedAccountId}
                  onValueChange={(value) => {
                    setSelectedAccountId(value);
                    setPage(1);
                    if (router.query.account_id || router.query.account_code) {
                      const { account_id, account_code, ...restQuery } = router.query;
                      void router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true });
                    }
                  }}
                  options={accountOptions}
                  disabled={accountQuery.isLoading}
                />
              </div>
              <div className="w-full sm:w-[260px]">
                <DatePickerWithRange
                  date={dateRange}
                  onChange={handleDateRangeChange}
                  enablePeriodFilter
                  modes={['date', 'month', 'year']}
                  modeLabels={{
                    date: 'Harian',
                    month: 'Bulanan',
                    year: 'Tahunan',
                  }}
                  mode={dateMode}
                  onModeChange={(mode) => {
                    setDateMode(mode);
                    setPage(1);
                  }}
                />
              </div>
              <Button type="button" variant="outline" onClick={handleReset} className="h-9">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          }
          page={page}
          perPage={perPage}
          total={pagination.total}
          lastPage={pagination.lastPage}
          perPageOptions={[25, 50, 100]}
          onPageChange={setPage}
          onPerPageChange={(value) => {
            setPerPage(value);
            setPage(1);
          }}
        >
          <div className="mb-4 grid overflow-hidden rounded-md border border-slate-200 bg-white grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            <div className="border-b border-slate-200 p-4 lg:border-b-0 lg:border-r">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Akun Buku Besar</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 truncate" title={accountLabel}>{accountLabel}</p>
              <p className="mt-0.5 text-xs text-slate-500">Periode {periodLabel}</p>
            </div>
            <div className="border-b border-slate-200 p-4 sm:border-r lg:border-b-0 sm:text-right">
              <div className="flex items-center justify-between sm:justify-end gap-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Saldo Awal</p>
                {summary.openingBalanceType && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-600">
                    {summary.openingBalanceType}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm font-bold tabular-nums text-slate-900">
                {currenciesFormat('idr', cashPosition.cashPositionBefore)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                {summary.openingBalanceDateFrom && summary.openingBalanceDateTo
                  ? `${summary.openingBalanceDateFrom} s/d ${summary.openingBalanceDateTo}`
                  : 'Posisi kas sebelum transaksi'}
              </p>
            </div>
            <div className="border-b border-slate-200 p-4 lg:border-b-0 lg:border-r sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total Debet</p>
              <p className="mt-1 text-sm font-bold tabular-nums text-emerald-700">
                {currenciesFormat('idr', summary.totalDebit)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">Total mutasi debet</p>
            </div>
            <div className="border-b border-slate-200 p-4 sm:border-r lg:border-b-0 sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total Kredit</p>
              <p className="mt-1 text-sm font-bold tabular-nums text-rose-700">
                {currenciesFormat('idr', summary.totalCredit)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">Total mutasi kredit</p>
            </div>
            <div className="bg-slate-50/70 p-4 sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Saldo Akhir</p>
              <p className="mt-1 text-sm font-bold tabular-nums text-slate-950">
                {currenciesFormat('idr', cashPosition.cashPositionAfter)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                Posisi kas setelah transaksi
              </p>
            </div>
          </div>

          <LaporanBukuBesarTable
            data={data}
            loading={isLoading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            totalDebit={summary.totalDebit}
            totalCredit={summary.totalCredit}
          />
        </SearchPagination>

        <LaporanBukuBesarPrintDocument
          data={data}
          template={templatePrint.selectedTemplate}
          fallbackBackground={selectedPrintBackground}
          companyName={getCompanyName(resolvedCompanyId)}
          accountLabel={accountLabel}
          periodLabel={periodLabel}
          openingBalance={cashPosition.cashPositionBefore}
          endingBalance={cashPosition.cashPositionAfter}
          reportPage={page}
          reportTotal={pagination.total}
          printedAt={templatePrint.printedAt}
        />

        <ReportTemplatePrintDialog
          open={templatePrint.isDialogOpen}
          onOpenChange={templatePrint.setIsDialogOpen}
          selectedTemplateId={templatePrint.selectedTemplateId}
          onTemplateChange={templatePrint.setSelectedTemplateId}
          onPrint={templatePrint.printWithSelectedTemplate}
          isPreparingPrint={templatePrint.isPreparingPrint}
          reportName="laporan buku besar"
        />
      </div>
    </DashboardLayout>
  );
}
