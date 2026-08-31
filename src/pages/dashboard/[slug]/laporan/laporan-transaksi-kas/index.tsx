import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { LaporanKasTable } from '@/components/features/laporan-kas/LaporanKasTable';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { useLaporanKas } from '@/hooks/useLaporanKas';
import { useCompany } from '@/contexts/CompanyContext';
import { resolveCompanyId, getLetterheadByCompanyId } from '@/lib/print-letterhead';
import { PrintLetterPage } from '@/components/common/PrintLetterPage';
import { formatDate } from '@/lib/utils/format';
import { SearchPagination } from '@/components/ui/search-pagination';
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

        {/* Main Table Content */}
        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari data"
          filters={
            <DatePickerWithRange
              date={dateRange}
              onChange={setDateRangeState}
              placeholder="Pilih rentang tanggal transaksi kas"
              className="w-full sm:w-[260px]"
            />
          }
          page={pagination.currentPage}
          perPage={pagination.perPage}
          total={pagination.total}
          lastPage={pagination.lastPage}
          perPageOptions={[25, 50, 100]}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        >
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
            </>
          )}
        </SearchPagination>
      </div>
    </DashboardLayout>
  );
}