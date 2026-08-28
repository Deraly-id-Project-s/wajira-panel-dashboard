"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Search, Printer } from 'lucide-react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';

import { useJumlahOutstandingReport } from '@/hooks/report/useJumlahOutstandingReport';
import { useCompany } from '@/contexts/CompanyContext';
import { resolveCompanyId, getLetterheadByCompanyId } from '@/lib/print-letterhead';
import { PrintLetterPage } from '@/components/common/PrintLetterPage';
import { formatDate } from '@/lib/utils/format';
import { OutstandingReportItem } from '@/services/report/jumlahOutstandingReport.service';

export default function LPJumlahOutstandingPage() {
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
  const { data, pagination, isLoading, isError, error } = useJumlahOutstandingReport({
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

  // Helpers for Outstanding Status & Keterangan
  const getOutstandingStatus = (
    type: 'bpkb' | 'stnk' | 'skpd' | 'tnkb',
    item: OutstandingReportItem
  ) => {
    let status: boolean | null = null;
    if (type === 'bpkb') status = item.bpkb_physical_status;
    else if (type === 'stnk') status = item.stnk_physical_status;
    else if (type === 'skpd') status = item.skpd_physical_status;
    else if (type === 'tnkb') status = item.tnkb_physical_status;

    if (status === true) return 'Sudah Diterima';
    if (status === false) return 'Outstanding / Belum Diterima';
    return '-';
  };

  const getOutstandingKeterangan = (
    type: 'bpkb' | 'stnk' | 'skpd' | 'tnkb',
    item: OutstandingReportItem
  ) => {
    const parts: string[] = [];

    if (type === 'bpkb') {
      if (item.bpkb_physical_status === false || !item.bpkb_received_date) {
        parts.push('BPKB belum diterima.');
      }
      if (!item.bpkb_number) {
        parts.push('Nomor BPKB belum tersedia.');
      }
    } else if (type === 'stnk') {
      if (item.stnk_physical_status === false || !item.stnk_received_date) {
        parts.push('STNK belum diterima.');
      }
    } else if (type === 'skpd') {
      if (item.skpd_physical_status === false || !item.skpd_received_date) {
        parts.push('SKPD belum diterima.');
      }
    } else if (type === 'tnkb') {
      if (item.tnkb_physical_status === false || !item.tnkb_received_date) {
        parts.push('TNKB belum diterima.');
      }
      if (!item.tnkb_number) {
        parts.push('Nomor TNKB belum tersedia.');
      }
    }

    const allComplete =
      item.bpkb_physical_status === true &&
      item.stnk_physical_status === true &&
      item.skpd_physical_status === true &&
      item.tnkb_physical_status === true &&
      Boolean(item.bpkb_number) &&
      Boolean(item.tnkb_number);

    if (allComplete) {
      return 'Dokumen sudah lengkap.';
    }

    return parts.join(' ') || '-';
  };

  const renderOutstandingStatusBadge = (statusText: string) => {
    if (statusText === 'Sudah Diterima') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
          Sudah Diterima
        </span>
      );
    }
    if (statusText === 'Outstanding / Belum Diterima') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
          Outstanding / Belum Diterima
        </span>
      );
    }
    return <span className="text-slate-400">-</span>;
  };

  const columns: ColumnDef<OutstandingReportItem>[] = useMemo(() => [
    {
      header: 'NO',
      id: 'no',
      alignment: 'center',
      cell: (_, idx) => <span className="font-medium text-slate-500">{idx + 1 + (page - 1) * perPage}</span>,
    },
    {
      header: activeTab === 'bpkb' ? 'NAMA BPKB' : 'NAMA STNK',
      accessorKey: 'stnk_name',
      sortable: true,
      cell: (item) => <span className="font-semibold text-gray-900 whitespace-nowrap">{item.stnk_name || item.vehicle_data?.stnk_name || '-'}</span>,
    },
    {
      header: 'WILAYAH',
      accessorKey: 'region',
      sortable: true,
      cell: (item) => <span className="text-slate-600 whitespace-nowrap">{item.region || item.vehicle_data?.regency || item.vehicle_data?.region?.name || '-'}</span>,
    },
    {
      header: 'DEALER',
      accessorKey: 'dealer',
      sortable: true,
      cell: (item) => <span className="text-slate-600 whitespace-nowrap">{item.dealer || item.vehicle_data?.dealer?.name || '-'}</span>,
    },
    {
      header: 'VENDOR',
      accessorKey: 'vendor',
      sortable: true,
      cell: (item) => {
        let vendor = '-';
        if (item.vendor) {
          if (typeof item.vendor === 'string') {
            vendor = item.vendor;
          } else {
            vendor = item.vendor.name || '-';
          }
        }
        return <span className="text-slate-600 whitespace-nowrap">{vendor}</span>;
      },
    },
    {
      header: 'NO POLISI',
      accessorKey: 'tnkb_number',
      sortable: true,
      cell: (item) => <span className="font-medium text-gray-900 whitespace-nowrap">{item.tnkb_number || '-'}</span>,
    },
    {
      header: 'JENIS',
      id: 'jenis',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap">{formatVehicleType(item.vehicle_type || item.vehicle_data?.motorcycle_type)}</span>,
    },
    {
      header: 'NO RANGKA',
      id: 'no_rangka',
      cell: (item) => <span className="text-slate-600 font-mono text-xs whitespace-nowrap">{item.chassis_number || item.vehicle_data?.chassis_number || '-'}</span>,
    },
    {
      header: 'NO MESIN',
      id: 'no_mesin',
      cell: (item) => <span className="text-slate-600 font-mono text-xs whitespace-nowrap">{item.machine_number || item.vehicle_data?.machine_number || '-'}</span>,
    },
    {
      header: 'STATUS',
      id: 'status',
      alignment: 'center',
      cell: (item) => <div className="whitespace-nowrap">{renderOutstandingStatusBadge(getOutstandingStatus(activeTab, item))}</div>,
    },
    {
      header: 'KETERANGAN',
      id: 'keterangan',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap">{getOutstandingKeterangan(activeTab, item)}</span>,
    }
  ], [activeTab, page, perPage]);

  // Print triggering handler
  const handlePrint = () => {
    window.print();
  };

  // Print Header Title based on active tab
  const getPrintTitle = () => {
    if (activeTab === 'bpkb') return 'LP Jumlah Outstanding BPKB';
    if (activeTab === 'stnk') return 'LP Jumlah Outstanding STNK';
    if (activeTab === 'skpd') return 'LP Jumlah Outstanding SKPD';
    return 'LP Jumlah Outstanding TNKB';
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Laporan Jumlah Outstanding - Wajira Dashboard</title>
      </Head>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="no-print">
          <PageHeader
            title="Laporan Jumlah Outstanding"
            subtitle="Laporan jumlah data outstanding dokumen kendaraan"
            actions={
              <Button onClick={handlePrint} variant="outline" className="w-full sm:w-auto">
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            }
          />
        </div>

        {/* Tabs Wrapper */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          {/* Tabs Navigation */}
          <div className="flex no-print">
            <TabsList className="flex h-auto p-1 bg-gray-50 border border-gray-100 rounded-md">
              <TabsTrigger value="bpkb" className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer">
                Outstanding BPKB
              </TabsTrigger>
              <TabsTrigger value="stnk" className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer">
                Outstanding STNK
              </TabsTrigger>
              <TabsTrigger value="skpd" className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer">
                Outstanding SKPD
              </TabsTrigger>
              <TabsTrigger value="tnkb" className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer">
                Outstanding TNKB
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="space-y-4">
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
              id="laporan-jumlah-outstanding-print"
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
                    PT WAJIRA YANOTAMA
                  </p>
                  <p className="text-[12px] text-gray-600">
                    Tanggal Cetak: {formatDate(new Date())}
                  </p>
                </div>

                <div className="rounded-md border border-gray-200 bg-white overflow-x-auto shadow-none">
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
                    sortBy={sortBy}
                    sortDirection={sortOrder}
                    onSortChange={(key, dir) => {
                      setSortBy(key);
                      setSortOrder(dir);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            </PrintLetterPage>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
