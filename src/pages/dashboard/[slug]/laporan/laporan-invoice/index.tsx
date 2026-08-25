"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Search, Printer, MoreVertical, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';

import { useInvoiceReport } from '@/hooks/report/useInvoiceReport';
import { useCompany } from '@/contexts/CompanyContext';
import { resolveCompanyId, getLetterheadByCompanyId } from '@/lib/print-letterhead';
import { PrintLetterPage } from '@/components/common/PrintLetterPage';
import { formatDate, formatMoney } from '@/lib/utils/format';

export default function LaporanInvoicePage() {
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
  const { data, pagination, isLoading, isError, error } = useInvoiceReport({
    page,
    perPage,
    search: debouncedSearch,
    orderBy,
    orderSort,
  });

  // Formatting helpers
  const formatDateString = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return format(date, 'dd MMMM yyyy', { locale: id });
  };

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      header: 'NO',
      id: 'no',
      alignment: 'center',
      cell: (_, idx) => <span className="font-medium text-slate-500">{idx + 1 + (page - 1) * perPage}</span>,
    },
    {
      header: 'NO SURAT INV',
      accessorKey: 'code',
      sortable: true,
      cell: (item) => <span className="font-mono text-sm text-gray-900 whitespace-nowrap">{item.code || '-'}</span>,
    },
    {
      header: 'TANGGAL',
      id: 'tanggal',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{formatDate(item.date)}</span>,
    },
    {
      header: 'NO POLISI',
      id: 'no_polisi',
      cell: (item) => <span className="font-mono text-sm text-slate-600 whitespace-nowrap">{item.vehicle?.registrationNumber || '-'}</span>,
    },
    {
      header: 'TIPE',
      id: 'tipe',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{item.vehicle?.type || item.orderList?.vehicleType || '-'}</span>,
    },
    {
      header: 'DRIVER',
      id: 'driver',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{item.driver?.name || '-'}</span>,
    },
    {
      header: 'LOADING IN',
      id: 'loading_in',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{item.orderList?.loadingIn || '-'}</span>,
    },
    {
      header: 'TUJUAN',
      id: 'tujuan',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{item.orderList?.doDeliveryDestination || '-'}</span>,
    },
    {
      header: 'LOADING OUT',
      id: 'loading_out',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{item.orderList?.loadingOut || '-'}</span>,
    },
    {
      header: 'INV EKSPEDISI',
      id: 'inv_ekspedisi',
      cell: (item) => <span className="font-semibold text-gray-900 whitespace-nowrap text-sm">{formatMoney(item.orderList?.billInvoice || 0, 'IDR')}</span>,
    },
    {
      header: 'BIAYA',
      id: 'biaya',
      cell: (item) => <span className="font-semibold text-gray-900 whitespace-nowrap text-sm">{formatMoney((item.additional_fee || 0) + (item.other_fee || 0), 'IDR')}</span>,
    },
    {
      header: 'AKSI',
      id: 'aksi',
      alignment: 'center',
      isAction: true,
      cell: (item) => (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px] rounded-md border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                onClick={() => {
                  router.push(`/dashboard/${slugParam}/finance/invoice/${item.id}`);
                }}
                className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4" />
                Detail
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    }
  ], [page, perPage, slugParam, router]);

  // Print triggering handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Laporan Invoice - Wajira Dashboard</title>
      </Head>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="no-print">
          <PageHeader
            title="Laporan Invoice"
            subtitle="Laporan data invoice ekspedisi"
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
                    <SelectItem value="10">10</SelectItem>
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
            id="laporan-invoice-print"
            className="laporan-penerimaan-print-area"
            letterheadSrc={selectedPrintBackground}
          >
            <div className="laporan-penerimaan-print-content print-letter-content">
              {/* Cover Letter Heading - Visible only in Print */}
              <div className="hidden print:flex flex-col items-center justify-center text-center space-y-1 mb-6 w-full">
                <h2 className="text-[18px] font-bold uppercase text-gray-900 tracking-wide">
                  Laporan Invoice
                </h2>
                <p className="text-[15px] font-bold text-gray-900 tracking-wide">
                  PT WAJIRA TRANSINDO
                </p>
                <p className="text-[12px] text-gray-600">
                  Tanggal Cetak: {formatDate(new Date())}
                </p>
              </div>

              <div className="rounded-md border border-gray-200 bg-white overflow-x-auto shadow-none w-full">
                <BaseTable
                  data={data}
                  columns={columns}
                  loading={isLoading}
                  meta={{
                    currentPage: page,
                    perPage: perPage,
                    lastPage: pagination.lastPage,
                    total: pagination.total,
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
              </div>
            </div>
          </PrintLetterPage>
        </div>
      </div>
    </DashboardLayout>
  );
}
