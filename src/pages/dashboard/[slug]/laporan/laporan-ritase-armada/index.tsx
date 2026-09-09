"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Printer, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { TableRow, TableHead } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { SearchPagination } from '@/components/ui/search-pagination';

import { useCompany } from '@/contexts/CompanyContext';
import { resolveCompanyId, getLetterheadByCompanyId } from '@/lib/print-letterhead';
import { PrintLetterPage } from '@/components/common/PrintLetterPage';
import { formatDate } from '@/lib/utils/format';

// Mock Data
const MOCK_RITASE = [
  { id: 1, tanggal: '2026-02-12', noPolisi: 'AB 0000 XX', tipe: 'FUSO', driver: 'Ahmad Syahroni', invEkspedisi: 1500000, biayaTambahan: null, ujDriver: 500000, biayaLainnya: null, invEkspedisiPendapatan: 2000000, tambahan: 0, ppn: 0, labaRugi: 1500000, ritase: 12 },
  { id: 2, tanggal: '2026-02-12', noPolisi: 'AB 0000 XX', tipe: 'FUSO', driver: 'Andhi Thok', invEkspedisi: 1500000, biayaTambahan: null, ujDriver: 500000, biayaLainnya: null, invEkspedisiPendapatan: 2000000, tambahan: 0, ppn: 0, labaRugi: 1500000, ritase: 12 },
  { id: 3, tanggal: '2026-02-12', noPolisi: 'AB 0000 XX', tipe: 'FUSO', driver: 'Ahmad Syahroni', invEkspedisi: 1500000, biayaTambahan: null, ujDriver: 500000, biayaLainnya: null, invEkspedisiPendapatan: 2000000, tambahan: 0, ppn: 0, labaRugi: 1500000, ritase: 12 },
  { id: 4, tanggal: '2026-02-12', noPolisi: 'AB 0000 XX', tipe: 'FUSO', driver: 'Ahmad Syahroni', invEkspedisi: 1500000, biayaTambahan: null, ujDriver: 500000, biayaLainnya: null, invEkspedisiPendapatan: 2000000, tambahan: 0, ppn: 0, labaRugi: 1500000, ritase: 12 },
  { id: 5, tanggal: '2026-02-12', noPolisi: 'AB 0000 XX', tipe: 'FUSO', driver: 'Ahmad Syahroni', invEkspedisi: 1500000, biayaTambahan: null, ujDriver: 500000, biayaLainnya: null, invEkspedisiPendapatan: 2000000, tambahan: 0, ppn: 0, labaRugi: 1500000, ritase: 12 },
  { id: 6, tanggal: '2026-02-12', noPolisi: 'AB 0000 XX', tipe: 'FUSO', driver: 'Ahmad Syahroni', invEkspedisi: 1500000, biayaTambahan: null, ujDriver: 500000, biayaLainnya: null, invEkspedisiPendapatan: 2000000, tambahan: 0, ppn: 0, labaRugi: 1500000, ritase: 12 },
  { id: 7, tanggal: '2026-02-12', noPolisi: 'AB 0000 XX', tipe: 'FUSO', driver: 'Ahmad Syahroni', invEkspedisi: 1500000, biayaTambahan: null, ujDriver: 500000, biayaLainnya: null, invEkspedisiPendapatan: 2000000, tambahan: 0, ppn: 0, labaRugi: 1500000, ritase: 12 },
  { id: 8, tanggal: '2026-02-12', noPolisi: 'AB 0000 XX', tipe: 'FUSO', driver: 'Ahmad Syahroni', invEkspedisi: 1500000, biayaTambahan: null, ujDriver: 500000, biayaLainnya: null, invEkspedisiPendapatan: 2000000, tambahan: 0, ppn: 0, labaRugi: 1500000, ritase: 12 },
];

const MOCK_MAINTENANCE = [
  { id: 1, noPolisi: 'AB 1234 XX', tipe: 'FUSO', driverPic: 'Ahmad Syahroni', sparepart: 'Ban', qty: 1, keterangan: 'Ganti ban', tglPerbaikan: '2026-01-12' },
  { id: 2, noPolisi: 'AB 4321 XO', tipe: 'TOWING', driverPic: 'Deni Caknun', sparepart: 'Oli', qty: 2, keterangan: 'Ganti oli', tglPerbaikan: '2026-06-02' },
  { id: 3, noPolisi: 'AB 9999 XX', tipe: 'FUSO', driverPic: 'Falah Hadialah', sparepart: 'Mesin', qty: 1, keterangan: 'Servis Mesin', tglPerbaikan: '2026-06-02' },
  { id: 4, noPolisi: 'AB 1241 XX', tipe: 'FUSO', driverPic: 'Wahyu Alima', sparepart: 'Ban', qty: 4, keterangan: 'Ganti ban 2 set', tglPerbaikan: '2026-06-02' },
  { id: 5, noPolisi: 'AB 1555 BGT', tipe: 'TOWING', driverPic: 'Gogon', sparepart: 'Seatbelt', qty: 1, keterangan: 'Ganti seatbelt', tglPerbaikan: '2026-06-02' },
  { id: 6, noPolisi: 'AB 1555 BGT', tipe: 'TOWING', driverPic: 'Gogon', sparepart: 'Seatbelt', qty: 1, keterangan: 'Ganti seatbelt', tglPerbaikan: '2026-06-02' },
  { id: 7, noPolisi: 'AB 1555 BGT', tipe: 'TOWING', driverPic: 'Gogon', sparepart: 'Seatbelt', qty: 1, keterangan: 'Ganti seatbelt', tglPerbaikan: '2026-06-02' },
  { id: 8, noPolisi: 'AB 1555 BGT', tipe: 'TOWING', driverPic: 'Gogon', sparepart: 'Seatbelt', qty: 1, keterangan: 'Ganti seatbelt', tglPerbaikan: '2026-06-02' },
];

export default function LaporanRitaseArmadaPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const slugParam = router.query.slug;

  const resolvedCompanyId = resolveCompanyId(slugParam, companyId) || 4;
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);

  const getCompanyName = (coId: number) => {
    if (coId === 1) return 'PT WAJIRA JAGRATARA MORINDO';
    if (coId === 3) return 'PT WAJIRA YANOTAMA';
    if (coId === 4) return 'PT WAJIRA TRANSINDO';
    return 'PT WAJIRA';
  };

  // States
  const [activeTab, setActiveTab] = useState<'ritase' | 'maintenance'>('ritase');
  const [searchTerm, setSearchTerm] = useState('');
  const [perPage, setPerPage] = useState('25');
  const [page, setPage] = useState(1);

  // Modal Edit Ritase State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRitaseValue, setEditRitaseValue] = useState('');

  // Formatters
  const formatDateString = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return format(date, 'dd/MM/yyyy');
  };

  const formatIDR = (value?: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handlePrint = () => {
    window.print();
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchTerm, perPage]);

  // Pagination Math
  const limit = Number(perPage);
  const startIndex = (page - 1) * limit;

  // Filter & Slice Ritase
  const filteredRitase = MOCK_RITASE.filter((item) => {
    if (!searchTerm) return true;
    return Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()));
  });
  const paginatedRitase = filteredRitase.slice(startIndex, startIndex + limit);

  // Filter & Slice Maintenance
  const filteredMaintenance = MOCK_MAINTENANCE.filter((item) => {
    if (!searchTerm) return true;
    return Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()));
  });
  const paginatedMaintenance = filteredMaintenance.slice(startIndex, startIndex + limit);

  const handleOpenEdit = () => {
    setEditRitaseValue('');
    setIsEditModalOpen(true);
  };

  const ritaseColumns: ColumnDef<any>[] = useMemo(() => [
    {
      header: 'TANGGAL',
      id: 'tanggal',
      alignment: 'center',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{formatDate(item.tanggal)}</span>,
    },
    {
      header: 'NO POLISI',
      id: 'noPolisi',
      alignment: 'center',
      cell: (item) => <span className="font-mono text-sm text-slate-700 whitespace-nowrap">{item.noPolisi}</span>,
    },
    {
      header: 'TIPE',
      id: 'tipe',
      alignment: 'center',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{item.tipe}</span>,
    },
    {
      header: 'DRIVER',
      id: 'driver',
      alignment: 'center',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{item.driver}</span>,
    },
    {
      header: 'INV EKSPEDISI',
      id: 'invEkspedisi1',
      alignment: 'center',
      headerClassName: 'border-r border-slate-200',
      cell: (item) => <span className="text-slate-800 font-medium whitespace-nowrap text-sm">{formatIDR(item.invEkspedisi)}</span>,
      className: 'border-r border-slate-100',
    },
    {
      header: 'BIAYA TAMBAHAN',
      id: 'biayaTambahan',
      alignment: 'center',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{formatIDR(item.biayaTambahan)}</span>,
    },
    {
      header: 'UJ DRIVER',
      id: 'ujDriver',
      alignment: 'center',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{formatIDR(item.ujDriver)}</span>,
    },
    {
      header: 'BIAYA LAINNYA',
      id: 'biayaLainnya',
      alignment: 'center',
      headerClassName: 'border-r border-slate-200',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{formatIDR(item.biayaLainnya)}</span>,
      className: 'border-r border-slate-100',
    },
    {
      header: 'INV EKSPEDISI',
      id: 'invEkspedisi2',
      alignment: 'center',
      cell: (item) => <span className="text-slate-800 font-medium whitespace-nowrap text-sm">{formatIDR(item.invEkspedisiPendapatan)}</span>,
    },
    {
      header: 'TAMBAHAN',
      id: 'tambahan',
      alignment: 'center',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{formatIDR(item.tambahan)}</span>,
    },
    {
      header: 'PPN',
      id: 'ppn',
      alignment: 'center',
      headerClassName: 'border-r border-slate-200',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{formatIDR(item.ppn)}</span>,
      className: 'border-r border-slate-100',
    },
    {
      header: 'LABA/RUGI',
      id: 'labaRugi',
      alignment: 'center',
      headerClassName: 'border-r border-slate-200',
      cell: (item) => <span className="text-slate-800 font-medium whitespace-nowrap text-sm">{formatIDR(item.labaRugi)}</span>,
      className: 'border-r border-slate-100',
    },
    {
      header: 'RITASE',
      id: 'ritase',
      alignment: 'center',
      headerClassName: 'border-r border-slate-200',
      cell: (item) => <span className="text-slate-800 font-medium whitespace-nowrap text-sm">{item.ritase}</span>,
      className: 'border-r border-slate-100',
    },
    {
      header: 'Aksi',
      id: 'aksi',
      alignment: 'center',
      sticky: 'right',
      cell: () => (
        <div className="flex justify-center">
          <Button variant="ghost" size="icon" onClick={handleOpenEdit} className="h-8 w-8 text-slate-500 hover:text-slate-900 cursor-pointer">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      ),
    }
  ], []);

  const maintenanceColumns: ColumnDef<any>[] = useMemo(() => [
    {
      header: 'NO',
      id: 'no',
      alignment: 'center',
      cell: (_, idx) => <span className="font-medium text-slate-500 text-sm">{idx + 1 + (page - 1) * limit}</span>,
    },
    {
      header: 'NO POLISI',
      id: 'noPolisi',
      cell: (item) => <span className="font-mono text-sm text-slate-700 whitespace-nowrap">{item.noPolisi}</span>,
    },
    {
      header: 'TIPE',
      id: 'tipe',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{item.tipe}</span>,
    },
    {
      header: 'DRIVER/PIC',
      id: 'driverPic',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{item.driverPic}</span>,
    },
    {
      header: 'SPAREPART',
      id: 'sparepart',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{item.sparepart}</span>,
    },
    {
      header: 'QTY',
      id: 'qty',
      alignment: 'center',
      cell: (item) => <span className="text-slate-800 font-medium whitespace-nowrap text-sm">{item.qty}</span>,
    },
    {
      header: 'KETERANGAN',
      id: 'keterangan',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{item.keterangan}</span>,
    },
    {
      header: 'TGL PERBAIKAN',
      id: 'tglPerbaikan',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{formatDateString(item.tglPerbaikan)}</span>,
    }
  ], [page, limit]);

  const ritaseHeaderGroups = (
    <TableRow className="hover:bg-transparent border-b border-slate-200">
      <TableHead colSpan={5} className="text-center text-xs font-bold uppercase text-slate-700 whitespace-nowrap border-r border-slate-200 bg-slate-100">
        LAPORAN TARGET INCOME EKSPEDISI PT WAJIRA JAGRATARA MORINDO
      </TableHead>
      <TableHead colSpan={3} className="text-center text-xs font-bold uppercase text-slate-700 whitespace-nowrap border-r border-slate-200 bg-slate-100">
        BIAYA DAN PENGELUARAN
      </TableHead>
      <TableHead colSpan={3} className="text-center text-xs font-bold uppercase text-slate-700 whitespace-nowrap border-r border-slate-200 bg-slate-100">
        PENDAPATAN
      </TableHead>
      <TableHead className="text-center text-xs font-bold uppercase text-slate-700 whitespace-nowrap border-r border-slate-200 bg-slate-100">
        KETERANGAN
      </TableHead>
      <TableHead className="text-center text-xs font-bold uppercase text-slate-700 whitespace-nowrap border-r border-slate-200 bg-slate-100">
        DATA TARGET
      </TableHead>
      <TableHead className="bg-slate-50 sticky right-0 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)] w-[80px] min-w-[80px] max-w-[80px] no-print"></TableHead>
    </TableRow>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="no-print">
          <PageHeader
            title="Laporan Ritase Armada"
            subtitle="Laporan ritase armada yang sudah dilakukan"
          />
        </div>

        <SearchPagination
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari data"
          page={page}
          perPage={limit}
          total={activeTab === 'ritase' ? filteredRitase.length : filteredMaintenance.length}
          lastPage={Math.max(1, Math.ceil((activeTab === 'ritase' ? filteredRitase.length : filteredMaintenance.length) / limit))}
          perPageOptions={[5, 25, 50, 100]}
          onPageChange={setPage}
          onPerPageChange={(value) => {
            setPerPage(String(value));
            setPage(1);
          }}
          actions={
            <Button onClick={handlePrint} variant="outline" className="w-full sm:w-auto">
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          }
        >
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'ritase' | 'maintenance')} className="w-full">
            {/* Tabs Navigation */}
            <div className="flex mb-4 no-print">
              <TabsList className="flex h-auto p-1 bg-gray-50 border border-gray-100 rounded-md">
                <TabsTrigger
                  value="ritase"
                  className="rounded-md px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer whitespace-nowrap"
                >
                  Laporan Ritase Armada
                </TabsTrigger>
                <TabsTrigger
                  value="maintenance"
                  className="rounded-md px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer whitespace-nowrap"
                >
                  Laporan Maintenance Armada
                </TabsTrigger>
              </TabsList>
            </div>

            <PrintLetterPage
              id="laporan-ritase-print"
              className="laporan-penerimaan-print-area"
              letterheadSrc={selectedPrintBackground}
            >
              <div className="laporan-penerimaan-print-content print-letter-content">
                {/* Cover Letter Heading - Visible only in Print */}
                <div className="hidden print:flex flex-col items-center justify-center text-center space-y-1 mb-6 w-full">
                  <h2 className="text-[18px] font-bold uppercase text-gray-900 tracking-wide">
                    {activeTab === 'ritase' ? 'Laporan Ritase Armada' : 'Laporan Maintenance Armada'}
                  </h2>
                  <p className="text-[15px] font-bold text-gray-900 tracking-wide">
                    {getCompanyName(resolvedCompanyId)}
                  </p>
                  <p className="text-[12px] text-gray-600">
                    Tanggal Cetak: {formatDate(new Date())}
                  </p>
                </div>

                <div className="rounded-md border border-slate-200 bg-white overflow-x-auto shadow-none w-full">
                  <BaseTable
                    data={activeTab === 'ritase' ? paginatedRitase : paginatedMaintenance}
                    columns={activeTab === 'ritase' ? ritaseColumns : maintenanceColumns}
                    loading={false}
                    headerGroups={activeTab === 'ritase' ? ritaseHeaderGroups : undefined}
                    headerRowClassName="bg-slate-50"
                  />
                </div>
              </div>
            </PrintLetterPage>
          </Tabs>
        </SearchPagination>
      </div>

      {/* Edit Ritase Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] p-6 rounded-md bg-white shadow-xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-slate-900">Edit Ritase</DialogTitle>
            <DialogDescription className="text-[14px] text-slate-500 mt-1">
              Edit ritase yang dilakukan
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Label htmlFor="ritase" className="text-sm font-semibold text-slate-700">
              Ritase
            </Label>
            <Input
              id="ritase"
              placeholder="Contoh: 12"
              value={editRitaseValue}
              onChange={(e) => setEditRitaseValue(e.target.value)}
              className="rounded-md border-slate-200 bg-white h-11"
            />
          </div>
          <DialogFooter className="mt-6 flex flex-col sm:flex-col gap-3">
            <Button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="w-full bg-[#1c3553] hover:bg-[#122438] text-white rounded-md h-11 font-medium cursor-pointer"
            >
              Simpan
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="w-full rounded-md border-slate-200 h-11 font-medium cursor-pointer mt-0 sm:mt-0"
            >
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}
