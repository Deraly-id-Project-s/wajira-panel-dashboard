import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
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
import { LedgerAccountSelect } from '@/components/features/laporan-buku-besar/LedgerAccountSelect';
import { LaporanJurnalUmumTable } from '@/components/features/laporan-jurnal-umum/LaporanJurnalUmumTable';
import { LaporanJurnalUmumPrintDocument } from '@/components/features/laporan-jurnal-umum/LaporanJurnalUmumPrintDocument';
import { ReportTemplatePrintDialog } from '@/components/ui/report-template-print-dialog';
import { useGeneralJournalReport } from '@/hooks/report/useGeneralJournalReport';
import { useAccounts } from '@/hooks/useAccount';
import { useReportTemplatePrint } from '@/hooks/useReportTemplatePrint';
import type { GeneralJournalReportParams } from '@/@types/general-journal-report.types';
import { useCompany } from '@/contexts/CompanyContext';
import { getLetterheadByCompanyId, resolveCompanyId, getCompanyName } from '@/lib/print-letterhead';
import { exportGeneralJournalReport } from '@/services/report/generalJournalReport.service';

export default function LaporanJurnalUmumPage() {
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null;
  const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : startDate;

  const queryParams = useMemo<GeneralJournalReportParams>(
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

  const { data, pagination, isLoading, isFetching } = useGeneralJournalReport({
    ...queryParams,
    enabled: Boolean(resolvedCompanyId),
  });

  const handleSortChange = (key: string, direction: 'asc' | 'desc') => {
    setSortBy(key);
    setSortOrder(direction);
    setPage(1);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportGeneralJournalReport({
        ...queryParams,
        page: undefined,
        per_page: undefined,
      });
      toast.success('Laporan jurnal umum berhasil diexport');
    } catch (error: any) {
      toast.error(error?.message || 'Gagal export laporan jurnal umum');
    } finally {
      setIsExporting(false);
    }
  };

  const periodLabel = startDate
    ? `${dateRange?.from ? format(dateRange.from, 'dd MMM yyyy') : '-'}${endDate && endDate !== startDate && dateRange?.to ? ` – ${format(dateRange.to, 'dd MMM yyyy')}` : ''}`
    : 'Semua periode';

  const accountLabel = selectedAccount
    ? `${selectedAccount.code || '-'} · ${selectedAccount.type ? `[${selectedAccount.type}] ` : ''}${selectedAccount.name || '-'}`
    : 'Semua akun';

  return (
    <DashboardLayout>
      <Head>
        <title>Laporan Jurnal Umum - Wajira Dashboard</title>
      </Head>

      <div className="space-y-6">
        <div className="no-print">
          <PageHeader
            title="Laporan Jurnal Umum"
            subtitle="Pantau rincian transaksi memorial jurnal umum yang telah diposting"
            actions={
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button onClick={handleExport} variant="outline" disabled={isFetching || isExporting}>
                  <Download className="mr-2 h-4 w-4" />
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
                <Button onClick={templatePrint.openPrintDialog} variant="outline">
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            }
          />
        </div>

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Cari kode jurnal atau keterangan..."
          searchAriaLabel="Cari data jurnal umum"
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
          <LaporanJurnalUmumTable
            data={data}
            loading={isLoading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            meta={{
              currentPage: page,
              perPage,
              lastPage: pagination.lastPage,
              total: pagination.total,
            }}
            onPageChange={setPage}
          />
        </SearchPagination>

        <LaporanJurnalUmumPrintDocument
          data={data}
          template={templatePrint.selectedTemplate}
          fallbackBackground={selectedPrintBackground}
          companyName={getCompanyName(resolvedCompanyId)}
          accountLabel={accountLabel}
          periodLabel={periodLabel}
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
          reportName="laporan jurnal umum"
        />
      </div>
    </DashboardLayout>
  );
}
