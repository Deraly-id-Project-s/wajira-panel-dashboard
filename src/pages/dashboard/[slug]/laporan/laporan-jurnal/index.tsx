import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Download, Printer, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PrintLetterPage } from '@/components/common/PrintLetterPage';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange, type DateRangePickerMode } from '@/components/ui/date-range-picker';
import { SearchPagination } from '@/components/ui/search-pagination';
import { LedgerAccountSelect } from '@/components/features/laporan-buku-besar/LedgerAccountSelect';
import { LaporanJurnalTable } from '@/components/features/laporan-jurnal/LaporanJurnalTable';
import { useJournalReport } from '@/hooks/report/useJournalReport';
import { useAccounts } from '@/hooks/useAccount';
import { JournalReportParams } from '@/@types/journal-report.types';
import { useCompany } from '@/contexts/CompanyContext';
import { getLetterheadByCompanyId, resolveCompanyId } from '@/lib/print-letterhead';
import { formatDate } from '@/lib/utils/format';
import { exportJournalReport } from '@/services/report/journalReport.service';

const getCompanyName = (companyId: number) => {
  if (companyId === 1) return 'PT WAJIRA JAGRATARA MORINDO';
  if (companyId === 3) return 'PT WAJIRA YANOTAMA';
  if (companyId === 4) return 'PT WAJIRA TRANSINDO';
  return 'PT WAJIRA';
};

export default function LaporanJurnalPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const resolvedCompanyId = resolveCompanyId(router.query.slug, companyId) || 1;
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);

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

  const queryParams = useMemo<JournalReportParams>(
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

  const { data, pagination, isLoading, isFetching } = useJournalReport({
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
      await exportJournalReport({
        ...queryParams,
        page: undefined,
        per_page: undefined,
      });
      toast.success('Laporan jurnal berhasil diexport');
    } catch (error: any) {
      toast.error(error?.message || 'Gagal export laporan jurnal');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="no-print">
          <PageHeader
            title="Laporan Jurnal"
            subtitle="Pantau jurnal transaksi berdasarkan akun dan periode pembayaran"
            actions={
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button onClick={handleExport} variant="outline" disabled={isFetching || isExporting}>
                  <Download className="mr-2 h-4 w-4" />
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
                <Button onClick={() => window.print()} variant="outline">
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            }
          />
        </div>

        <div className="flex flex-col gap-4 rounded-md border border-slate-200 bg-white p-4 no-print">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_290px_auto] lg:items-end">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-700">Akun</label>
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

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-700">Periode Pembayaran</label>
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
        </div>

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari data"
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
          <PrintLetterPage
          id="laporan-jurnal-print"
          className="laporan-jurnal-print-area"
          letterheadSrc={selectedPrintBackground}
        >
          <div className="print-letter-content">
            <div className="mb-8 hidden flex-col items-center justify-center space-y-1 text-center print:flex">
              <h2 className="text-[13px] font-bold uppercase tracking-wide text-gray-900">Laporan Jurnal</h2>
              <p className="text-[13px] font-bold tracking-wide text-gray-900">
                {getCompanyName(resolvedCompanyId)}
              </p>
              <p className="text-[11px] text-gray-600">Tanggal Cetak: {formatDate(new Date())}</p>
            </div>

            <LaporanJurnalTable
              data={data}
              loading={isLoading}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
            />
          </div>
        </PrintLetterPage>
        </SearchPagination>
      </div>
    </DashboardLayout>
  );
}
