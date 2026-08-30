"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Search, Printer, Loader2, ArrowUpDown, MoreVertical, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { useExpeditionReport } from '@/hooks/report/useExpeditionReport';
import { useCompany } from '@/contexts/CompanyContext';
import { resolveCompanyId, getLetterheadByCompanyId } from '@/lib/print-letterhead';
import { PrintLetterPage } from '@/components/common/PrintLetterPage';
import { getVisiblePageNumbers } from '@/lib/api/pagination';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/format';

export default function LaporanSuratJalanPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const slugParam = router.query.slug;

  const resolvedCompanyId = resolveCompanyId(slugParam, companyId) || 4; // Transindo defaults to 4
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);

  // States
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(25);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [orderBy, setOrderBy] = useState<string>('created_at');
  const [orderSort, setOrderSort] = useState<'asc' | 'desc'>('desc');

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch report data
  const { data, pagination, isLoading, isError, error } = useExpeditionReport({
    page,
    perPage,
    search: debouncedSearch,
    orderBy,
    orderSort,
  });

  const visiblePages = getVisiblePageNumbers(pagination.lastPage, page, 5);

  // Formatting helpers
  const formatDateString = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return format(date, 'dd MMMM yyyy', { locale: id });
  };

  // Sorting handler
  const handleSort = (field: string) => {
    if (orderBy === field) {
      setOrderSort(orderSort === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(field);
      setOrderSort('desc');
    }
    setPage(1);
  };

  // Print triggering handler
  const handlePrint = () => {
    window.print();
  };

  const columns: ColumnDef<any>[] = [
    {
      header: 'NO',
      id: 'no',
      alignment: 'center',
      cell: (_, idx) => <span className="font-medium text-slate-500">{idx + 1 + (page - 1) * perPage}</span>,
    },
    {
      header: 'KODE SURAT JALAN',
      accessorKey: 'code',
      sortable: true,
      cell: (item) => <span className="font-mono text-gray-900">{item.code || '-'}</span>,
    },
    {
      header: 'KODE ORDER',
      id: 'orderCode',
      cell: (item) => <span className="font-mono text-slate-600">{item.order_list?.code || '-'}</span>,
    },
    {
      header: 'TANGGAL',
      id: 'date',
      cell: (item) => <span className="text-slate-600">{formatDate(item.date)}</span>,
    },
    {
      header: 'CUSTOMER',
      id: 'customer',
      cell: (item) => <span className="font-semibold text-gray-900">{item.order_list?.customer?.name || '-'}</span>,
    },
    {
      header: 'NO POLISI',
      id: 'nopol',
      cell: (item) => <span className="font-mono text-slate-600">{item.vehicle?.registration_number || '-'}</span>,
    },
    {
      header: 'TIPE ARMADA',
      id: 'tipe',
      cell: (item) => <span className="text-slate-600">{item.vehicle?.type || item.order_list?.vehicle_type || '-'}</span>,
    },
    {
      header: 'DRIVER',
      id: 'driver',
      cell: (item) => <span className="text-slate-600">{item.driver?.name || '-'}</span>,
    },
    {
      header: 'LOADING IN',
      id: 'loadingIn',
      cell: (item) => <span className="text-slate-600">{item.order_list?.loading_in || '-'}</span>,
    },
    {
      header: 'LOADING OUT',
      id: 'loadingOut',
      cell: (item) => <span className="text-slate-600">{item.order_list?.loading_out || '-'}</span>,
    },
    {
      header: 'TUJUAN KIRIM',
      id: 'tujuan',
      cell: (item) => <span className="text-slate-600">{item.order_list?.do_delivery_destination || '-'}</span>,
    },
    {
      header: 'STATUS PRINT',
      id: 'status',
      cell: (item) => (
        item.is_printed === true ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="h-3 w-3" /> Sudah Print
          </span>
        ) : item.is_printed === false ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <XCircle className="h-3 w-3" /> Belum Print
          </span>
        ) : (
          '-'
        )
      ),
    },
    {
      header: 'Aksi',
      id: 'aksi',
      alignment: 'center',
      sticky: 'right',
      cell: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px] rounded-md border-slate-200 p-1.5 shadow-lg">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/${slugParam}/laporan/laporan-surat-jalan/${item.id}`);
              }}
              className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
            >
              <FileText className="mr-2 h-4 w-4" />
              Detail
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="no-print">
          <PageHeader
            title="Laporan Surat Jalan"
            subtitle="Laporan data surat jalan ekspedisi"
            actions={
              <Button onClick={handlePrint} variant="outline" className="w-full sm:w-auto">
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            }
          />
        </div>

        <div className="space-y-4">

          {/* Filtering Block (Search and Show Page dropdown) */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between no-print">
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
          </div>

          {/* Print Letter Wrapping Container */}
          <PrintLetterPage
            id="laporan-surat-jalan-print"
            className="laporan-penerimaan-print-area"
            letterheadSrc={selectedPrintBackground}
          >
            <div className="laporan-penerimaan-print-content print-letter-content">
              {/* Cover Letter Heading - Visible only in Print */}
              <div className="hidden print:flex flex-col items-center justify-center text-center space-y-1 mb-6 w-full">
                <h2 className="text-[18px] font-bold uppercase text-gray-900 tracking-wide">
                  Laporan Surat Jalan
                </h2>
                <p className="text-[15px] font-bold text-gray-900 tracking-wide">
                  PT WAJIRA TRANSINDO
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
                  sortBy={orderBy}
                  sortDirection={orderSort}
                  onSortChange={(key, dir) => {
                    setOrderBy(key);
                    setOrderSort(dir);
                    setPage(1);
                  }}
                />
              )}
            </div>
          </PrintLetterPage>
        </div>
      </div>
    </DashboardLayout>
  );
}
