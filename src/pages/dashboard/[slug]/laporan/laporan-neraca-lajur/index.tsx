import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Download, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/router';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

import type { BalanceColumnReportParams } from '@/@types/balance-column-report.types';
import { LaporanNeracaLajurTable } from '@/components/features/laporan-neraca-lajur/LaporanNeracaLajurTable';
import { LedgerAccountSelect } from '@/components/features/laporan-buku-besar/LedgerAccountSelect';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  DatePickerWithRange,
  type DateRangePickerMode,
} from '@/components/ui/date-range-picker';
import { PageHeader } from '@/components/ui/page-header';
import { SearchPagination } from '@/components/ui/search-pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReportArchiveAction } from '@/components/features/report-archive/ReportArchiveAction';
import type { ReportArchiveColumn } from '@/lib/report-archive';
import { useCompany } from '@/contexts/CompanyContext';
import { useAccounts } from '@/hooks/useAccount';
import { useBalanceColumnReport } from '@/hooks/report/useBalanceColumnReport';
import { resolveCompanyId } from '@/lib/print-letterhead';
import { exportBalanceColumnReport } from '@/services/report/balanceColumnReport.service';

export default function LaporanNeracaLajurPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const resolvedCompanyId = resolveCompanyId(router.query.slug, companyId) || 1;

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dateMode, setDateMode] = useState<DateRangePickerMode>('date');
  const [sortBy, setSortBy] = useState('account_code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [transactionFilter, setTransactionFilter] = useState<'accounts' | 'account_with_transactions'>('accounts');
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
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null;
  const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : startDate;

  const queryParams = useMemo<BalanceColumnReportParams>(() => ({
    company_id: resolvedCompanyId,
    page,
    per_page: perPage,
    start_date: startDate,
    end_date: endDate,
    account_id: selectedAccountId,
    account_code: selectedAccount?.code ?? null,
    account_name: selectedAccount?.name ?? null,
    search: search || null,
    transaction_filter: transactionFilter,
    sort_by: sortBy,
    sort_order: sortOrder,
  }), [
    endDate,
    page,
    perPage,
    resolvedCompanyId,
    search,
    selectedAccount?.code,
    selectedAccount?.name,
    selectedAccountId,
    sortBy,
    sortOrder,
    startDate,
    transactionFilter,
  ]);

  const { data, pagination, isLoading, isFetching } = useBalanceColumnReport({
    ...queryParams,
    enabled: Boolean(resolvedCompanyId),
  });

  const handleReset = () => {
    setSelectedAccountId(null);
    setSearchInput('');
    setSearch('');
    setDateRange(undefined);
    setDateMode('date');
    setTransactionFilter('accounts');
    setSortBy('account_code');
    setSortOrder('asc');
    setPage(1);
  };

  const periodLabel = dateRange?.from
    ? `${format(dateRange.from, 'dd MMM yyyy')}${dateRange.to ? ` - ${format(dateRange.to, 'dd MMM yyyy')}` : ''}`
    : 'Semua Periode';

  const archiveColumns = useMemo<ReportArchiveColumn[]>(() => [
    { key: 'kode_akun', label: 'Kode Akun', align: 'left' },
    { key: 'nama_akun', label: 'Nama Akun', align: 'left' },
    { key: 'pos_akun', label: 'Pos Akun', align: 'center' },
    { key: 'saldo_normal', label: 'Saldo Normal', align: 'center' },
    { key: 'saldo_akun', label: 'Saldo Akun', align: 'right', format: 'currency' },
    { key: 'pergerakan.debit', label: 'Pergerakan (Debit)', align: 'right', format: 'currency' },
    { key: 'pergerakan.kredit', label: 'Pergerakan (Kredit)', align: 'right', format: 'currency' },
    { key: 'saldo_akhir.debit', label: 'Saldo Akhir (Debit)', align: 'right', format: 'currency' },
    { key: 'saldo_akhir.kredit', label: 'Saldo Akhir (Kredit)', align: 'right', format: 'currency' },
    { key: 'laba_rugi.debit', label: 'Laba Rugi (Debit)', align: 'right', format: 'currency' },
    { key: 'laba_rugi.kredit', label: 'Laba Rugi (Kredit)', align: 'right', format: 'currency' },
    { key: 'neraca.debit', label: 'Neraca (Debit)', align: 'right', format: 'currency' },
    { key: 'neraca.kredit', label: 'Neraca (Kredit)', align: 'right', format: 'currency' },
  ], []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportBalanceColumnReport({
        ...queryParams,
        page: undefined,
        per_page: undefined,
      });
      toast.success('Laporan neraca lajur berhasil diexport');
    } catch (error: any) {
      toast.error(error?.message || 'Gagal export laporan neraca lajur');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Laporan Neraca Lajur"
          subtitle="Pantau saldo awal, mutasi debit dan kredit, serta saldo akhir setiap akun"
          actions={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button onClick={handleExport} variant="outline" disabled={isFetching || isExporting}>
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
              <ReportArchiveAction
                reportTitle="Laporan Neraca Lajur"
                archiveSourceLabel="Neraca Lajur"
                periodLabel={periodLabel}
                data={data}
                columns={archiveColumns}
                disabled={isLoading}
              />
            </div>
          }
        />

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Cari kode atau nama akun"
          searchAriaLabel="Cari akun pada laporan neraca lajur"
          filters={
            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
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
              <div className="w-full sm:w-[230px]">
                <Select
                  value={transactionFilter}
                  onValueChange={(value) => {
                    setTransactionFilter(value as 'accounts' | 'account_with_transactions');
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-full bg-white border-slate-200 text-xs">
                    <SelectValue placeholder="Pilih Filter Transaksi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accounts">Filter Akun</SelectItem>
                    <SelectItem value="account_with_transactions">
                      Filter Akun dengan Transaksi
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-[260px]">
                <DatePickerWithRange
                  date={dateRange}
                  onChange={(range) => {
                    setDateRange(range);
                    setPage(1);
                  }}
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
          <LaporanNeracaLajurTable
            data={data}
            loading={isLoading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(key, direction) => {
              setSortBy(key);
              setSortOrder(direction);
              setPage(1);
            }}
          />
        </SearchPagination>
      </div>
    </DashboardLayout>
  );
}
