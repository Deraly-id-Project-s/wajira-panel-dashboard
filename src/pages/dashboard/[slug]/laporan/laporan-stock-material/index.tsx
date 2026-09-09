"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';

import { useStockMaterialReport } from '@/hooks/report/useStockMaterialReport';
import { useCompany } from '@/contexts/CompanyContext';
import { resolveCompanyId, getLetterheadByCompanyId } from '@/lib/print-letterhead';
import { PrintLetterPage } from '@/components/common/PrintLetterPage';
import { formatDate } from '@/lib/utils/format';



export default function LaporanStockMaterialPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const slugParam = router.query.slug;

  // Resolve companyId. PT Wajira Yanotama = 3
  const resolvedCompanyId = resolveCompanyId(slugParam, companyId) || 3;
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
  const { data, pagination, isLoading, isError, error } = useStockMaterialReport({
    activeTab,
    companyId: resolvedCompanyId,
    page,
    perPage,
    search: debouncedSearch,
    sortBy,
    sortOrder,
  });

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
    return 'PT WAJIRA YANOTAMA';
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
      cell: (_, idx) => <span className="text-slate-500">{idx + 1 + (page - 1) * perPage}</span>,
    },
    ...(activeTab !== 'stock' ? [{
      header: 'TANGGAL',
      accessorKey: 'transaction_date',
      sortable: true,
      alignment: 'center' as const,
      cell: (item: any) => <span className="text-slate-700 whitespace-nowrap">{
        item.goods_transaction?.transaction_date ? formatDate(item.goods_transaction.transaction_date) : '-'
      }</span>
    }] : []),
    {
      header: 'KODE BARANG',
      accessorKey: 'material_code',
      sortable: true,
      cell: (item) => <span className="font-semibold text-gray-900 whitespace-nowrap">{item.material?.code || '-'}</span>,
    },
    {
      header: 'NAMA BARANG',
      accessorKey: 'material_name',
      sortable: true,
      cell: (item) => <span className="text-slate-700 whitespace-nowrap">{item.material?.name || '-'}</span>,
    },
    {
      header: 'QTY',
      id: 'qty',
      alignment: 'center',
      cell: (item) => {
        let displayQty = 0;
        if (activeTab === 'stock') {
          displayQty = item.current_stock !== null && item.current_stock !== undefined ? item.current_stock : (item.qty || 0);
        } else {
          displayQty = item.qty || 0;
        }
        return <span className="text-slate-700 whitespace-nowrap">{displayQty}</span>;
      },
    },
    {
      header: 'SATUAN',
      id: 'satuan',
      cell: (item) => <span className="text-slate-700 whitespace-nowrap">{item.material?.type || item.type || '-'}</span>,
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="no-print">
          <PageHeader
            title="Laporan Stock Material"
            subtitle="Laporan stock material, penerimaan barang, dan pengeluaran barang"
          />
        </div>

        <SearchPagination
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
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
          actions={
            <Button onClick={handlePrint} variant="outline" className="w-full sm:w-auto">
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          }
        >
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {/* Tabs Navigation */}
            <div className="flex mb-4 no-print">
              <TabsList className="flex h-auto p-1 bg-gray-50 border border-gray-100 rounded-md">
                <TabsTrigger
                  value="stock"
                  className="rounded-md px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer"
                >
                  Laporan Stock Perlengkapan
                </TabsTrigger>
                <TabsTrigger
                  value="penerimaan"
                  className="rounded-md px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer"
                >
                  Laporan Penerimaan Barang
                </TabsTrigger>
                <TabsTrigger
                  value="pengeluaran"
                  className="rounded-md px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer"
                >
                  Laporan Pengeluaran Barang
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="space-y-4">


              {/* Print Letter Wrapping Container */}
              <PrintLetterPage
                id="laporan-stock-material-print"
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
            </div>
          </Tabs>
        </SearchPagination>
      </div>
    </DashboardLayout>
  );
}
