import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { LaporanBuktiPotongTable } from '@/components/features/laporan-bukti-potong/LaporanBuktiPotongTable';
import { Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { useWithholdingTaxes } from '@/hooks/useWithholdingTax';
import { SearchPagination } from '@/components/ui/search-pagination';
import { useCompany } from '@/contexts/CompanyContext';
import { resolveCompanyId, getLetterheadByCompanyId } from '@/lib/print-letterhead';
import { PrintLetterPage } from '@/components/common/PrintLetterPage';
import { formatDate } from '@/lib/utils/format';
import Head from 'next/head';
import { LoadingState } from '@/components/ui/loading-state';
import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';

export default function LaporanBuktiPotongPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const slugParam = router.query.slug;

  const resolvedCompanyId = resolveCompanyId(slugParam as string, companyId) || 3;
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);

  // States
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [dateRange, setDateRangeState] = useState<DateRange | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Handle Date Range locally
  const fromDate = dateRange?.from ? startOfDay(dateRange.from) : undefined;
  const toDate = dateRange?.to ? endOfDay(dateRange.to) : fromDate;

  // Query Hook (Reuse from Administrasi/Bukti Potong)
  const queryParams: any = {
    page,
    per_page: perPage,
    company_id: resolvedCompanyId,
    order_by: sortKey,
    order_dir: sortOrder,
    sort_by: sortKey,
    sort_order: sortOrder,
  };

  const { data: queryResult, isLoading: isInitialLoading, isFetching } = useWithholdingTaxes(queryParams);
  const isLoading = isInitialLoading || isFetching;

  const rawData = React.useMemo(() => queryResult?.data || [], [queryResult?.data]);
  
  // Safe Client-Side Array Filter
  const filteredData = React.useMemo(() => {
    let result = [...rawData];

    // Text Filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(item => {
        return (
          item.withholding_number?.toLowerCase().includes(q) ||
          item.no_invoice?.toLowerCase().includes(q) ||
          item.pph_description?.toLowerCase().includes(q)
        );
      });
    }

    // Date Filter
    if (fromDate && toDate) {
      result = result.filter(item => {
        if (!item.payment_date) return false;
        const d = parseISO(item.payment_date);
        if (isNaN(d.getTime())) return false;
        return isWithinInterval(d, { start: fromDate, end: toDate });
      });
    }

    return result;
  }, [rawData, searchQuery, fromDate, toDate]);

  const backendPagination = queryResult?.meta || {
    currentPage: 1,
    lastPage: 1,
    perPage: 25,
    total: 0,
  };
  
  const pagination = {
    ...backendPagination,
    total: (searchQuery.trim() || dateRange?.from) ? filteredData.length : backendPagination.total,
  };

  const getCompanyName = (coId: number) => {
    if (coId === 1) return 'PT WAJIRA JAGRATARA MORINDO';
    if (coId === 3) return 'PT WAJIRA YANOTAMA';
    if (coId === 4) return 'PT WAJIRA TRANSINDO';
    return 'PT WAJIRA JAGRATARA';
  };

  const handlePrint = () => {
    window.print();
  };

  const toCSV = (cells: any[]) => cells.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',');

  const handleDownload = () => {
    if (!filteredData || filteredData.length === 0) {
      toast.error('Tidak ada data untuk diunduh');
      return;
    }

    const header = ['NO', 'NO BUKTI POTONG', 'NO INVOICE', 'SUMBER', 'CASH', 'NILAI PPH', 'NOMINAL BAYAR', 'TGL BAYAR', 'KETERANGAN', 'UMUR BP (MASA)', 'TANGGAL DIBUAT'];
    const lines = [toCSV(header)];

    filteredData.forEach((item: any, index: number) => {
      lines.push(toCSV([
        index + 1,
        item.withholding_number || '-',
        item.no_invoice || '-',
        item.source === 'internal' ? 'internal' : 'Client / Supplier',
        item.cash?.cash_name || item.cash?.description || '-',
        item.pph_amount || 0,
        item.payment_amount || 0,
        item.payment_date ? format(new Date(item.payment_date), 'dd/MM/yyyy') : '-',
        item.pph_description || '-',
        item.withholding_age != null ? `${item.withholding_age} Bulan` : '-',
        item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : '-'
      ]));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-bukti-potong-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Laporan Bukti Potong berhasil diunduh');
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Laporan Bukti Potong - Wajira Dashboard</title>
      </Head>
      <div className="space-y-6">
        {/* Header */}
        <div className="no-print">
          <PageHeader
            title="Laporan Bukti Potong"
            subtitle="Pantau semua data PPh dan Bukti Potong Pajak"
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
              placeholder="Pilih rentang tanggal bukti potong"
              className="w-full sm:w-[260px]"
            />
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
          actions={
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button onClick={handleDownload} variant="outline" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={handlePrint} variant="outline" className="w-full sm:w-auto">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          }
        >
          <div className="pt-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-20 bg-white rounded-md border border-gray-200 shadow-sm">
                <LoadingState variant="page" />
              </div>
            ) : (
              <PrintLetterPage
                id="laporan-bukti-potong-print"
                className="laporan-bukti-potong-print-area"
                letterheadSrc={selectedPrintBackground}
              >
                <div className="laporan-bukti-potong-print-content print-letter-content">
                  {/* Cover Letter Heading - Visible only in Print */}
                  <div className="hidden print:flex flex-col items-center justify-center text-center space-y-1 mb-8 w-full">
                    <h2 className="text-[13px] font-bold uppercase text-gray-900 tracking-wide">
                      Laporan Bukti Potong
                    </h2>
                    <p className="text-[13px] font-bold text-gray-900 tracking-wide">
                      {getCompanyName(resolvedCompanyId)}
                    </p>
                    <p className="text-[11px] text-gray-600">
                      Tanggal Cetak: {formatDate(new Date())}
                    </p>
                  </div>

                  <LaporanBuktiPotongTable
                    data={filteredData}
                    onSort={handleSort} // sort is safe on backend as it doesnt commonly 500 error based on strict enums
                    sortKey={sortKey}
                    sortOrder={sortOrder}
                  />
                </div>
              </PrintLetterPage>
            )}
          </div>
        </SearchPagination>
      </div>
    </DashboardLayout>
  );
}
