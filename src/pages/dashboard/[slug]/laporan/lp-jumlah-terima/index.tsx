"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Printer, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';

import { useJumlahTerimaReport } from '@/hooks/report/useJumlahTerimaReport';
import { useCompany } from '@/contexts/CompanyContext';
import { resolveCompanyId, getLetterheadByCompanyId } from '@/lib/print-letterhead';
import { PrintLetterPage } from '@/components/common/PrintLetterPage';
import { formatDate } from '@/lib/utils/format';



export default function LPJumlahTerimaPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const slugParam = router.query.slug;

  const resolvedCompanyId = resolveCompanyId(slugParam, companyId);
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);

  // States
  const [activeTab, setActiveTab] = useState<'bpkb' | 'stnk' | 'skpd' | 'tnkb'>('bpkb');
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(25);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page, search and sorting when tab changes
  const handleTabChange = (val: string) => {
    setActiveTab(val as 'bpkb' | 'stnk' | 'skpd' | 'tnkb');
    setPage(1);
    setSearchTerm('');
    setDebouncedSearch('');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  // Fetch report data
  const { data, pagination, isLoading, isError, error } = useJumlahTerimaReport({
    activeTab,
    page,
    perPage,
    search: debouncedSearch,
    sortBy,
    sortOrder,
  });

  const formatVehicleType = (type?: string | null) => {
    if (!type) return '-';
    const t = type.toLowerCase().trim();
    if (t === 'r2') return 'Roda Dua';
    if (t === 'r3') return 'Roda Tiga';
    if (t === 'r4') return 'Roda Empat';
    return type;
  };

  const renderPhysicalStatus = (status?: boolean | null) => {
    if (status === null || status === undefined) return '-';
    return status ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Ada / Tersedia
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        Belum Ada
      </span>
    );
  };

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

  const columns: ColumnDef<any>[] = [
    {
      header: 'NO',
      id: 'no',
      alignment: 'center',
      cell: (_, idx) => <span className="font-medium text-slate-500">{idx + 1 + (page - 1) * perPage}</span>,
    },
    {
      header: `NAMA ${activeTab.toUpperCase()}`,
      accessorKey: 'stnk_name',
      sortable: true,
      cell: (item) => <span className="font-semibold text-gray-900 whitespace-nowrap">{item.stnk_name || '-'}</span>,
    },
    ...(activeTab === 'bpkb' ? [{
      header: 'NOMOR BPKB',
      accessorKey: 'bpkb_number',
      sortable: true,
      cell: (item: any) => <span className="font-medium whitespace-nowrap text-gray-900">{item.bpkb_number || '-'}</span>,
    }] : []),
    ...(activeTab === 'stnk' ? [{
      header: 'NOMOR STNK',
      accessorKey: 'stnk_number',
      sortable: true,
      cell: (item: any) => <span className="font-medium whitespace-nowrap text-gray-900">{item.stnk_number || '-'}</span>,
    }] : []),
    {
      header: 'WILAYAH',
      accessorKey: 'region',
      sortable: true,
      cell: (item) => <span className="text-slate-600 whitespace-nowrap">{item.region || '-'}</span>,
    },
    {
      header: 'DEALER',
      accessorKey: 'dealer',
      sortable: true,
      cell: (item) => <span className="text-slate-600 whitespace-nowrap">{item.dealer || '-'}</span>,
    },
    {
      header: 'VENDOR',
      accessorKey: 'vendor',
      sortable: true,
      cell: (item) => <span className="text-slate-600 whitespace-nowrap">{item.vendor || '-'}</span>,
    },
    {
      header: 'NO POLISI',
      accessorKey: 'tnkb_number',
      sortable: true,
      cell: (item) => <span className="font-medium text-gray-900 whitespace-nowrap">{item.tnkb_number || '-'}</span>,
    },
    {
      header: 'JENIS',
      accessorKey: 'vehicle_type',
      sortable: true,
      cell: (item) => <span className="text-slate-600 whitespace-nowrap">{formatVehicleType(item.vehicle_type)}</span>,
    },
    {
      header: 'NO RANGKA',
      accessorKey: 'chassis_number',
      sortable: true,
      cell: (item) => <span className="text-slate-600 font-mono whitespace-nowrap">{item.chassis_number || '-'}</span>,
    },
    {
      header: 'NO MESIN',
      accessorKey: 'machine_number',
      sortable: true,
      cell: (item) => <span className="text-slate-600 font-mono whitespace-nowrap">{item.machine_number || '-'}</span>,
    },
    {
      header: 'TGL TERIMA',
      accessorKey: 'registration_date',
      sortable: true,
      alignment: 'center',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap">{formatDateString(item.registration_date)}</span>,
    },
    ...(activeTab === 'bpkb' || activeTab === 'stnk' ? [{
      header: `FISIK ${activeTab.toUpperCase()}`,
      accessorKey: `${activeTab}_physical_status`,
      sortable: true,
      alignment: 'center' as const,
      cell: (item: any) => renderPhysicalStatus(item[`${activeTab}_physical_status`]),
    }] : [])
  ];

  return (
    <DashboardLayout>
      <Head>
        <title>Laporan Jumlah Terima - Wajira Dashboard</title>
      </Head>

      <div className="space-y-6">
        {/* Header Section */}
        <div className="no-print">
          <PageHeader
            title="Laporan Jumlah Terima"
            subtitle="Laporan jumlah data masuk ke sistem"
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
          {/* Tabs Navigation (Pills structure) */}
          <div className="flex mb-4 no-print">
            <TabsList className="flex h-auto p-1 bg-gray-50 border border-gray-100 rounded-md">
              <TabsTrigger
                value="bpkb"
                className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer"
              >
                LP Jumlah Terima BPKB
              </TabsTrigger>
              <TabsTrigger
                value="stnk"
                className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer"
              >
                LP Jumlah Terima STNK
              </TabsTrigger>
              <TabsTrigger
                value="skpd"
                className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer"
              >
                LP Jumlah Terima SKPD
              </TabsTrigger>
              <TabsTrigger
                value="tnkb"
                className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer"
              >
                LP Jumlah Terima TNKB
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="space-y-4">


            {/* Print Letter Wrapping Container */}
            <PrintLetterPage
              id="laporan-jumlah-terima-print"
              className="laporan-penerimaan-print-area"
              letterheadSrc={selectedPrintBackground}
            >
              <div className="laporan-penerimaan-print-content print-letter-content">
                {/* Cover Letter Heading - Visible only in Print */}
                <div className="hidden print:flex flex-col items-center justify-center text-center space-y-1 mb-6 w-full">
                  <h2 className="text-[18px] font-bold uppercase text-gray-900 tracking-wide">
                    {activeTab === 'bpkb' && 'LP Jumlah Terima BPKB'}
                    {activeTab === 'stnk' && 'LP Jumlah Terima STNK'}
                    {activeTab === 'skpd' && 'LP Jumlah Terima SKPD'}
                    {activeTab === 'tnkb' && 'LP Jumlah Terima TNKB'}
                  </h2>
                  <p className="text-[15px] font-bold text-gray-900 tracking-wide">
                    PT WAJIRA YANOTAMA
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
