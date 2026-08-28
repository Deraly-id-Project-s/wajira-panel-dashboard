"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Search, Printer, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

import { useStockPerlengkapanReport } from '@/hooks/report/useStockPerlengkapanReport';
import { useCompany } from '@/contexts/CompanyContext';
import { resolveCompanyId, getLetterheadByCompanyId } from '@/lib/print-letterhead';
import { PrintLetterPage } from '@/components/common/PrintLetterPage';
import { getVisiblePageNumbers } from '@/lib/api/pagination';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/format';



export default function LaporanStockPerlengkapanPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const slugParam = router.query.slug;

  // Resolve companyId. Defaults to Wajira Transindo (4) for this sub-menu
  const resolvedCompanyId = resolveCompanyId(slugParam, companyId) || 4;
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);

  // States
  const [activeTab, setActiveTab] = useState<'stock' | 'penerimaan' | 'pengeluaran'>('stock');
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(25);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page when tab changes
  const handleTabChange = (val: string) => {
    setActiveTab(val as 'stock' | 'penerimaan' | 'pengeluaran');
    setPage(1);
  };

  // Fetch report data
  const { data, pagination, isLoading, isError, error } = useStockPerlengkapanReport({
    activeTab,
    companyId: resolvedCompanyId,
    page,
    perPage,
    search: debouncedSearch,
    sortBy,
    sortOrder,
  });

  const visiblePages = getVisiblePageNumbers(pagination.lastPage, page, 5);

  const formatDateString = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return format(date, 'dd MMMM yyyy', { locale: id });
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

  // Resolve Company Name for Cover Letter Print Heading
  const getCompanyName = (coId: number) => {
    if (coId === 1) return 'PT WAJIRA JAGRATARA MORINDO';
    if (coId === 3) return 'PT WAJIRA YANOTAMA';
    if (coId === 4) return 'PT WAJIRA TRANSINDO';
    return 'PT WAJIRA TRANSINDO';
  };

  // Print Header Title based on active tab
  const getPrintTitle = () => {
    if (activeTab === 'stock') return 'Laporan Stock Perlengkapan';
    if (activeTab === 'penerimaan') return 'Laporan Penerimaan Barang';
    return 'Laporan Pengeluaran Barang';
  };

  const columns: ColumnDef<any>[] = [
    {
      header: 'NO',
      id: 'no',
      alignment: 'center',
      cell: (_, idx) => <span className="font-medium text-slate-500">{idx + 1 + (page - 1) * perPage}</span>,
    },
    ...(activeTab !== 'stock' ? [{
      header: 'TANGGAL',
      accessorKey: 'transaction_date',
      sortable: true,
      alignment: 'center' as const,
      cell: (item: any) => <span className="text-slate-600 whitespace-nowrap">{
        item.goods_transaction?.transaction_date ? formatDate(item.goods_transaction.transaction_date) : '-'
      }</span>
    }] : []),
    {
      header: 'KODE BARANG',
      accessorKey: 'code',
      sortable: true,
      cell: (item: any) => <span className="font-mono text-gray-900 whitespace-nowrap">{item.vehicle_equipment?.code || item.code || '-'}</span>,
    },
    {
      header: 'NAMA BARANG',
      accessorKey: 'name',
      sortable: true,
      cell: (item: any) => <span className="font-semibold text-gray-900 whitespace-nowrap">{item.vehicle_equipment?.name || item.name || '-'}</span>,
    },
    {
      header: 'QTY',
      id: 'qty',
      alignment: 'center',
      cell: (item: any) => {
        let displayQty = 0;
        if (activeTab === 'stock') {
          displayQty = item.current_stock !== undefined && item.current_stock !== null
            ? item.current_stock
            : (item.total_stock !== undefined && item.total_stock !== null ? item.total_stock : (item.qty || 0));
        } else {
          displayQty = item.qty || 0;
        }
        return <span className="font-medium text-gray-900 whitespace-nowrap">{displayQty}</span>;
      },
    },
    ...(activeTab === 'stock' ? [{
      header: 'LOKASI/ARMADA',
      id: 'lokasi',
      cell: (item: any) => <span className="text-slate-600 whitespace-nowrap">{
        item.location ||
        item.goods_transaction?.location ||
        item.vehicle_fleet?.registration_number ||
        item.goods_transaction?.vehicle_fleet?.registration_number ||
        item.goods_transaction?.vehicle?.registration_number ||
        item.armada ||
        '-'
      }</span>,
    }] : []),
    ...(activeTab === 'penerimaan' ? [{
      header: 'LOKASI',
      id: 'lokasi',
      cell: (item: any) => <span className="text-slate-600 whitespace-nowrap">{item.location || item.goods_transaction?.location || '-'}</span>,
    }] : []),
    ...(activeTab === 'pengeluaran' ? [
      {
        header: 'NO POLISI',
        id: 'no_polisi',
        cell: (item: any) => <span className="font-mono text-gray-900 whitespace-nowrap">{
          item.goods_transaction?.vehicle_fleet?.registration_number ||
          item.vehicle_fleet?.registration_number ||
          item.goods_transaction?.vehicle?.registration_number ||
          item.armada ||
          '-'
        }</span>,
      },
      {
        header: 'DRIVER',
        id: 'driver',
        cell: (item: any) => <span className="text-slate-600 whitespace-nowrap">{
          item.goods_transaction?.driver?.name || item.driver?.name || '-'
        }</span>,
      }
    ] : [])
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="no-print">
          <PageHeader
            title="Laporan Stock Perlengkapan"
            subtitle="Laporan stock perlengkapan, penerimaan barang, dan pengeluaran barang"
          />
        </div>

        {/* Search + Print row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search here"
                className="pl-9 bg-white"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
              <span>Show</span>
              <Select value={String(perPage)} onValueChange={(value) => { setPerPage(Number(value)); }}>
                <SelectTrigger className="w-[70px] bg-white">
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
          <Button onClick={handlePrint} variant="outline" className="w-full sm:w-auto">
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Tabs Navigation */}
          <div className="flex mb-4 no-print">
            <TabsList className="flex h-auto p-1 bg-gray-50 border border-gray-100 rounded-md w-fit">
              <TabsTrigger
                value="stock"
                className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer whitespace-nowrap"
              >
                Laporan Stock Perlengkapan
              </TabsTrigger>
              <TabsTrigger
                value="penerimaan"
                className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer whitespace-nowrap"
              >
                Laporan Penerimaan Barang
              </TabsTrigger>
              <TabsTrigger
                value="pengeluaran"
                className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer whitespace-nowrap"
              >
                Laporan Pengeluaran Barang
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Print Letter Wrapping Container */}
          <PrintLetterPage
            id="laporan-stock-perlengkapan-print"
            className="laporan-penerimaan-print-area"
            letterheadSrc={selectedPrintBackground}
          >
            <div className="laporan-penerimaan-print-content print-letter-content">
              {/* Cover Letter Heading - Visible only in Print */}
              <div className="hidden print:flex flex-col items-center justify-center text-center space-y-1 mb-6 w-full">
                <h2 className="text-[18px] font-bold uppercase text-gray-900 tracking-wide">
                  {getPrintTitle()}
                </h2>
                <p className="text-[15px] font-bold text-gray-900 tracking-wide">
                  {getCompanyName(resolvedCompanyId)}
                </p>
                <p className="text-[12px] text-gray-600">
                  Tanggal Cetak: {formatDate(new Date())}
                </p>
              </div>

              {/* Base Table Rendering */}
              {isError ? (
                <div className="flex flex-col justify-center items-center py-20 w-full bg-white rounded-md border border-red-100 text-center p-6">
                  <p className="text-red-600 font-semibold mb-1">Gagal memuat data laporan</p>
                  <p className="text-sm text-slate-500">{(error as any)?.message || 'Terjadi kesalahan pada server backend'}</p>
                </div>
              ) : (
                <BaseTable
                  data={data}
                  columns={columns}
                  loading={isLoading}
                  meta={{
                    currentPage: page,
                    perPage: perPage,
                    lastPage: pagination.lastPage,
                    total: pagination.total
                  }}
                  onPageChange={setPage}
                  sortBy={sortBy}
                  sortDirection={sortOrder}
                  onSortChange={(key, dir) => {
                    setSortBy(key);
                    setSortOrder(dir);
                    setPage(1);
                  }}
                />
              )}
            </div>
          </PrintLetterPage>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
