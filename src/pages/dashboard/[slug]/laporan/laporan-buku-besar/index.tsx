import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Printer, RotateCcw, Search } from 'lucide-react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PrintLetterPage } from '@/components/common/PrintLetterPage';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePickerWithRange, type DateRangePickerMode } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LedgerAccountSelect } from '@/components/features/laporan-buku-besar/LedgerAccountSelect';
import { LaporanBukuBesarTable } from '@/components/features/laporan-buku-besar/LaporanBukuBesarTable';
import { useLedgerReport } from '@/hooks/report/useLedgerReport';
import { useAccounts } from '@/hooks/useAccount';
import type { LedgerReportParams } from '@/@types/ledger-report.types';
import { useCompany } from '@/contexts/CompanyContext';
import { getLetterheadByCompanyId, resolveCompanyId } from '@/lib/print-letterhead';
import { formatDate } from '@/lib/utils/format';
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="no-print">
          <PageHeader
            title="Laporan Buku Besar"
            subtitle="Pantau mutasi akun dan posisi saldo berdasarkan periode pembayaran"
            actions={
              <Button onClick={() => window.print()} variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            }
          />
        </div>

        <div className="flex flex-col gap-4 rounded-md border border-slate-200 bg-white p-4 no-print">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_minmax(220px,1fr)_290px_auto] lg:items-end">
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
              <label className="text-[13px] font-medium text-slate-700">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Cari kode transaksi atau keterangan"
                  className="h-9 bg-white pl-9"
                />
              </div>
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

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Show</span>
            <Select
              value={String(perPage)}
              onValueChange={(value) => {
                setPerPage(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[72px] bg-white">
                <SelectValue placeholder="25" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>Page</span>
          </div>
        </div>

        <PrintLetterPage
          id="laporan-buku-besar-print"
          className="laporan-buku-besar-print-area"
          letterheadSrc={selectedPrintBackground}
        >
          <div className="print-letter-content">
            <div className="mb-8 hidden flex-col items-center justify-center space-y-1 text-center print:flex">
              <h2 className="text-[13px] font-bold uppercase tracking-wide text-gray-900">Laporan Buku Besar</h2>
              <p className="text-[13px] font-bold tracking-wide text-gray-900">
                {getCompanyName(resolvedCompanyId)}
              </p>
              <p className="text-[11px] text-gray-600">Tanggal Cetak: {formatDate(new Date())}</p>
            </div>

            <div className="mb-4 grid gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-[minmax(260px,1fr)_180px_180px]">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-slate-500">Akun</p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedAccount ? `${selectedAccount.code} - ${selectedAccount.name}` : 'Semua akun'}
                </p>
              </div>
              <div className="space-y-1 md:text-right">
                <p className="text-xs font-semibold uppercase text-slate-500">Saldo Awal</p>
                <p className="text-sm font-bold text-slate-900">{currenciesFormat('idr', summary.openingBalance)}</p>
              </div>
              <div className="space-y-1 md:text-right">
                <p className="text-xs font-semibold uppercase text-slate-500">Saldo Akhir</p>
                <p className="text-sm font-bold text-slate-900">{currenciesFormat('idr', summary.endingBalance)}</p>
              </div>
            </div>

            <LaporanBukuBesarTable
              data={data}
              loading={isLoading}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              meta={{
                currentPage: pagination.currentPage,
                perPage: pagination.perPage,
                lastPage: pagination.lastPage,
                total: pagination.total,
              }}
              onPageChange={setPage}
            />
          </div>
        </PrintLetterPage>
      </div>
    </DashboardLayout>
  );
}
