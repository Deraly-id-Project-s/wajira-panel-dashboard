import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Printer, RotateCcw } from 'lucide-react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange, type DateRangePickerMode } from '@/components/ui/date-range-picker';
import { SearchPagination } from '@/components/ui/search-pagination';
import { ReportTemplatePrintDialog } from '@/components/ui/report-template-print-dialog';
import { LedgerAccountSelect } from '@/components/features/laporan-buku-besar/LedgerAccountSelect';
import { LaporanBukuBesarTable } from '@/components/features/laporan-buku-besar/LaporanBukuBesarTable';
import { LaporanBukuBesarPrintDocument } from '@/components/features/laporan-buku-besar/LaporanBukuBesarPrintDocument';
import { useLedgerReport } from '@/hooks/report/useLedgerReport';
import { useAccounts } from '@/hooks/useAccount';
import { useReportTemplatePrint } from '@/hooks/useReportTemplatePrint';
import type { LedgerReportParams } from '@/@types/ledger-report.types';
import { useCompany } from '@/contexts/CompanyContext';
import { getLetterheadByCompanyId, resolveCompanyId } from '@/lib/print-letterhead';
import { currenciesFormat } from '@/components/ui/currenciesFormat';

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
  const [dateMode, setDateMode] = useState<DateRangePickerMode>('date');
  const [sortBy, setSortBy] = useState('payment_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null;
  const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : startDate;

  const queryParams = useMemo<LedgerReportParams>(
    () => ({
      company_id: resolvedCompanyId,
      page,
      per_page: perPage,
      start_date: startDate,
      end_date: endDate,
      account_id: selectedAccountId,
      account_code: selectedAccount?.code ?? null,
      account_name: selectedAccount?.name ?? null,
      search: search || null,
      sort_by: sortBy,
      sort_order: sortOrder,
    }),
    [resolvedCompanyId, page, perPage, startDate, endDate, selectedAccountId, selectedAccount?.code, selectedAccount?.name, search, sortBy, sortOrder],
  );

  const { data, summary, pagination, isLoading } = useLedgerReport({
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
    setDateMode('date');
    setPage(1);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
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
              <Button onClick={templatePrint.openPrintDialog} variant="outline" disabled={isLoading}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
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
                  mode={dateMode}
                  onModeChange={(mode) => {
                    setDateMode(mode);
                    setDateRange(undefined);
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
          <div className="mb-4 grid overflow-hidden rounded-md border border-slate-200 bg-white md:grid-cols-[minmax(260px,1fr)_200px_200px]">
            <div className="border-b border-slate-200 px-4 py-3 md:border-b-0 md:border-r">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Akun Buku Besar</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{accountLabel}</p>
              <p className="mt-0.5 text-xs text-slate-500">Periode {periodLabel}</p>
            </div>
            <div className="border-b border-slate-200 px-4 py-3 md:border-b-0 md:border-r md:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Saldo Awal Periode</p>
              <p className="mt-1 text-sm font-bold tabular-nums text-slate-900">{currenciesFormat('idr', summary.openingBalance)}</p>
              <p className="mt-1 text-xs font-semibold tabular-nums text-sky-700">{currenciesFormat('usd', summary.openingBalanceUsd)}</p>
            </div>
            <div className="bg-slate-50/70 px-4 py-3 md:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Saldo Akhir Periode</p>
              <p className="mt-1 text-sm font-bold tabular-nums text-slate-950">{currenciesFormat('idr', summary.endingBalance)}</p>
              <p className="mt-1 text-xs font-semibold tabular-nums text-sky-700">{currenciesFormat('usd', summary.endingBalanceUsd)}</p>
            </div>
          </div>

          <LaporanBukuBesarTable
            data={data}
            loading={isLoading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        </SearchPagination>

        <LaporanBukuBesarPrintDocument
          data={data}
          template={templatePrint.selectedTemplate}
          fallbackBackground={selectedPrintBackground}
          companyName={getCompanyName(resolvedCompanyId)}
          accountLabel={accountLabel}
          periodLabel={periodLabel}
          openingBalance={summary.openingBalance}
          endingBalance={summary.endingBalance}
          openingBalanceUsd={summary.openingBalanceUsd}
          endingBalanceUsd={summary.endingBalanceUsd}
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
