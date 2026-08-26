import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { LaporanKasTable } from '@/components/features/laporan-kas/LaporanKasTable';
import { Search, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLaporanKas } from '@/hooks/useLaporanKas';
import { cn } from '@/lib/utils';
import { useCompany } from '@/contexts/CompanyContext';
import { resolveCompanyId, getLetterheadByCompanyId } from '@/lib/print-letterhead';
import { PrintLetterPage } from '@/components/common/PrintLetterPage';
import { formatDate } from '@/lib/utils/format';
import { LoadingState } from '@/components/ui/loading-state';

export default function LaporanTransaksiKasPage() {
  const {
    data,
    pagination,
    isLoading,
    totalPemasukan,
    totalPengeluaran,
    setPage,
    setPerPage,
    setDateRange,
    setSearch,
    setSort,
    sortKey,
    sortOrder,
  } = useLaporanKas();

  const router = useRouter();
  const { companyId } = useCompany();
  const slugParam = router.query.slug;

  const resolvedCompanyId = resolveCompanyId(slugParam, companyId) || 3;
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);

  const getCompanyName = (coId: number) => {
    if (coId === 1) return 'PT WAJIRA JAGRATARA MORINDO';
    if (coId === 3) return 'PT WAJIRA YANOTAMA';
    if (coId === 4) return 'PT WAJIRA TRANSINDO';
    return 'PT WAJIRA JAGRATARA';
  };

  const handlePrint = () => {
    window.print();
  };

  const [dateRange, setDateRangeState] = useState<DateRange | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, setSearch]);

  // Trigger filter on date range change automatically
  useEffect(() => {
    const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null;
    const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : startDate;
    setDateRange(startDate, endDate);
  }, [dateRange, setDateRange]);

  const getPageNumbers = () => {
    const { currentPage, lastPage } = pagination;
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= lastPage; i++) {
      if (i === 1 || i === lastPage || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  const isLoadingDisplay = isLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="no-print">
          <PageHeader
            title="Laporan Transaksi Kas"
            subtitle="Pantau semua pemasukan dan pengeluaran"
            actions={
              <Button onClick={handlePrint} variant="outline" className="w-full sm:w-auto">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            }
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 no-print">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full sm:w-auto">
            {/* Cari Transaksi */}
            <div className="flex flex-col space-y-1.5 w-full sm:w-auto">
              <label className="text-[13px] font-medium text-slate-700">Cari Transaksi</label>
              <div className="relative w-full sm:w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search here"
                  className="pl-9 bg-white h-9"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </div>

            {/* Periode Transaksi */}
            <div className="flex flex-col space-y-1.5 w-full sm:w-auto">
              <label className="text-[13px] font-medium text-slate-700">Periode Transaksi</label>
              <div className="w-full sm:w-[280px]">
                <DatePickerWithRange date={dateRange} onChange={setDateRangeState} />
              </div>
            </div>

            {/* Tampilkan per halaman */}
            <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap h-9">
              <span>Show</span>
              <Select
                value={String(pagination.perPage)}
                onValueChange={(val) => setPerPage(Number(val))}
              >
                <SelectTrigger className="w-[70px] bg-white h-9">
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
        </div>

        {/* Main Table Content */}
        <div className="pt-4">
          {isLoadingDisplay ? (
            <div className="flex justify-center items-center py-20 bg-white rounded-md border border-gray-200 shadow-sm">
              <LoadingState variant="page" />
            </div>
          ) : (
            <>
              {/* Print Letter Wrapping Container */}
              <PrintLetterPage
                id="laporan-transaksi-kas-print"
                className="laporan-penerimaan-print-area"
                letterheadSrc={selectedPrintBackground}
              >
                <div className="laporan-penerimaan-print-content print-letter-content">
                  {/* Cover Letter Heading - Visible only in Print */}
                  <div className="hidden print:flex flex-col items-center justify-center text-center space-y-1 mb-8 w-full">
                    <h2 className="text-[13px] font-bold uppercase text-gray-900 tracking-wide">
                      Laporan Transaksi Kas
                    </h2>
                    <p className="text-[13px] font-bold text-gray-900 tracking-wide">
                      {getCompanyName(resolvedCompanyId)}
                    </p>
                    <p className="text-[11px] text-gray-600">
                      Tanggal Cetak: {formatDate(new Date())}
                    </p>
                  </div>

                  <LaporanKasTable
                    data={data}
                    totalPemasukan={totalPemasukan}
                    totalPengeluaran={totalPengeluaran}
                    onSort={(key) => setSort(key, sortKey === key && sortOrder === 'asc' ? 'desc' : 'asc')}
                    sortKey={sortKey}
                    sortOrder={sortOrder}
                  />
                </div>
              </PrintLetterPage>

              {/* Pagination */}
              {data.length > 0 && (
                <div className="flex flex-col gap-4 px-1 py-4 md:flex-row md:items-center md:justify-between no-print">
                  <div className="text-sm text-slate-500">
                    Showing {pagination.from || 0}–{pagination.to || 0} of {pagination.total} data
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="rounded-md px-3 hover:bg-slate-100 font-semibold text-[13px] cursor-pointer"
                    >
                      Previous
                    </Button>

                    {getPageNumbers().map((pageNumber, idx) => (
                      typeof pageNumber === 'number' ? (
                        <Button
                          key={idx}
                          variant={pageNumber === pagination.currentPage ? 'outline' : 'ghost'}
                          size="sm"
                          onClick={() => setPage(pageNumber)}
                          className={cn(
                            "h-9 min-w-9 rounded-md border-slate-200 text-[13px] font-semibold cursor-pointer",
                            pageNumber === pagination.currentPage
                              ? "bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-slate-200 hover:bg-slate-50"
                              : "text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          {pageNumber}
                        </Button>
                      ) : (
                        <span key={idx} className="px-1.5 text-slate-400">...</span>
                      )
                    ))}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.lastPage}
                      className="rounded-md px-3 hover:bg-slate-100 font-semibold text-[13px] cursor-pointer"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}