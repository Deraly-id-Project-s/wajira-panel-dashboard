"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Printer, Loader2, DownloadIcon } from 'lucide-react';
import { format } from 'date-fns';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';
import { SearchPagination } from '@/components/ui/search-pagination';

import { useAssetReport } from '@/hooks/report/useAssetReport';
import { useCompany } from '@/contexts/CompanyContext';
import { resolveCompanyId, getLetterheadByCompanyId } from '@/lib/print-letterhead';
import { PrintLetterPage } from '@/components/common/PrintLetterPage';
import { formatDate } from '@/lib/utils/format';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { Badge } from '@/components/ui/badge';

const getAssetTypeBadge = (type?: string | null) => {
  if (!type) return <Badge variant="outline">-</Badge>;
  switch (type.toLowerCase()) {
    case 'inventory':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Inventaris</Badge>;
    case 'vehicles':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Kendaraan</Badge>;
    case 'buildings':
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Bangunan</Badge>;
    case 'land':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Tanah</Badge>;
    default:
      return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">{type}</Badge>;
  }
};

export default function LaporanAssetPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const slugParam = router.query.slug;

  const resolvedCompanyId = resolveCompanyId(slugParam, companyId) || 3;
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);

  const getCompanyName = (coId: number) => {
    if (coId === 1) return 'PT WAJIRA JAGRATARA MORINDO';
    if (coId === 3) return 'PT WAJIRA YANOTAMA';
    if (coId === 4) return 'PT WAJIRA TRANSINDO';
    return 'PT WAJIRA';
  };

  // States
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(25);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch report data
  const { data, pagination, isLoading, isError, error } = useAssetReport({
    companyId: resolvedCompanyId,
    page,
    perPage,
    search: debouncedSearch,
    sortBy,
    sortOrder,
  });

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!dateRange?.from || !dateRange?.to) return data;

    const fromDate = startOfDay(dateRange.from);
    const toDate = endOfDay(dateRange.to);

    return data.filter((item: any) => {
      if (!item.asset?.purchase_date) return false;
      const tglBeli = parseISO(item.asset.purchase_date);
      return isWithinInterval(tglBeli, { start: fromDate, end: toDate });
    });
  }, [data, dateRange]);

  const formatDateString = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return format(date, 'dd/MM/yyyy');
  };

  // Sorting handler
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Print triggering handler
  const handlePrint = () => {
    window.print();
  };

  const toCSV = (cells: any[]) => cells.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',');

  const handleDownload = () => {
    if (!filteredData || filteredData.length === 0) {
      toast.error('Tidak ada data untuk diunduh');
      return;
    }

    const header = ['NO', 'KODE ASET', 'TGL BELI', 'NAMA BARANG', 'TIPE ASET', 'SERIAL NUMBER', 'HARGA BELI', 'UMUR EKONOMIS (TAHUN)', 'PENYUSUTAN PER BULAN', 'NILAI AKHIR'];
    const lines = [toCSV(header)];

    filteredData.forEach((item: any, index: number) => {
      lines.push(toCSV([
        index + 1,
        item.asset?.code || '-',
        item.asset?.purchase_date ? format(new Date(item.asset.purchase_date), 'dd/MM/yyyy') : '-',
        item.asset?.name || '-',
        item.asset?.type || '-',
        item.asset?.serial_number || '-',
        item.asset?.price || 0,
        item.economic_age || '-',
        item.depreciation_per_month || 0,
        item.final_value || 0
      ]));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-aset-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Laporan Aset berhasil diunduh');
  };

  const { slug } = router.query;
  const slugStr = typeof slug === 'string' ? slug : '';

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: 'KODE ASET',
        accessorKey: 'asset_code',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.asset?.code} />,
      },
      {
        header: 'TGL BELI',
        alignment: 'center',
        cell: (item) => formatDateString(item.asset?.purchase_date),
      },
      {
        header: 'NAMA BARANG',
        accessorKey: 'asset_name',
        sortable: true,
        alignment: 'left',
        cell: (item) => item.asset?.name ? <ReferenceLink href={`/dashboard/${slugStr}/master/asset?search=${item.asset?.name}`}>{item.asset?.name}</ReferenceLink> : '-'
      },
      {
        header: 'TIPE ASET',
        alignment: 'left',
        cell: (item) => getAssetTypeBadge(item.asset?.type),
      },
      {
        header: 'SERIAL NUMBER',
        accessorKey: 'serial_number',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.asset?.serial_number || '-'} />
      },
      {
        header: 'HARGA BELI',
        alignment: 'left',
        cell: (item) => currenciesFormat('idr', item.asset?.price),
      },
      {
        header: 'UMUR EKONOMIS',
        alignment: 'left',
        cell: (item) => item.economic_age !== null && item.economic_age !== undefined ? `${item.economic_age} TAHUN` : '-',
      },
      {
        header: 'PENYUSUTAN/BULAN',
        alignment: 'left',
        cell: (item) => currenciesFormat('idr', item.depreciation_per_month || 0),
      },
      {
        header: 'NILAI AKHIR',
        alignment: 'left',
        cell: (item) => currenciesFormat('idr', item.final_value || 0),
      },
    ],
    [slugStr]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="no-print">
          <PageHeader
            title="Laporan Aset"
            subtitle="Laporan data aset perusahaan"
            actions={
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={handleDownload} variant="outline" className="flex-1 sm:flex-none">
                  <DownloadIcon className="h-4.5 w-4.5 text-slate-700 mr-2" /> Download
                </Button>
                <Button onClick={handlePrint} variant="outline" className="flex-1 sm:flex-none">
                  <Printer className="h-4.5 w-4.5 text-slate-700 mr-2" /> Print
                </Button>
              </div>
            }
          />
        </div>

        {/* Periode Filter */}
        <div className="no-print">
          <DatePickerWithRange
            date={dateRange}
            onChange={setDateRange}
            className="w-full sm:w-auto min-w-[260px]"
          />
        </div>

        {/* Print Letter Wrapping Container */}
        <SearchPagination
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari data"
          page={page}
          perPage={perPage}
          total={pagination.total}
          lastPage={pagination.lastPage}
          perPageOptions={[5, 10, 25, 50, 100]}
          onPageChange={setPage}
          onPerPageChange={(value) => {
            setPerPage(value);
            setPage(1);
          }}
        >
          <PrintLetterPage
            id="laporan-aset-print"
            className="laporan-penerimaan-print-area"
            letterheadSrc={selectedPrintBackground}
          >
          <div className="laporan-penerimaan-print-content print-letter-content">
            {/* Cover Letter Heading - Visible only in Print */}
            <div className="hidden print:flex flex-col items-center justify-center text-center space-y-1 mb-6 w-full">
              <h2 className="text-[18px] font-bold uppercase text-gray-900 tracking-wide">
                Laporan Aset
              </h2>
              <p className="text-[15px] font-bold text-gray-900 tracking-wide">
                {getCompanyName(resolvedCompanyId)}
              </p>
              <p className="text-[12px] text-gray-600">
                Tanggal Cetak: {formatDate(new Date())}
              </p>
            </div>

            {/* Table Rendering */}
            {isError ? (
              <div className="flex flex-col justify-center items-center py-20 w-full bg-white rounded-md border border-red-100 text-center p-6 no-print">
                <p className="text-red-600 font-semibold mb-1">Gagal memuat data laporan</p>
                <p className="text-sm text-slate-500">{(error as any)?.message || 'Terjadi kesalahan pada server backend'}</p>
              </div>
            ) : (
              <BaseTable
                data={filteredData || []}
                columns={columns}
                loading={isLoading}
                sortBy={sortBy}
                sortDirection={sortOrder}
                onSortChange={(key) => handleSort(key)}
              />
            )}
          </div>
          </PrintLetterPage>
        </SearchPagination>
      </div>
    </DashboardLayout>
  );
}
