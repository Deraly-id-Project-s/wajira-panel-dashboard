import { LoadingState } from '@/components/ui/loading-state';
import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { useStockSpareparts } from '@/hooks/useStockSparepart';
import { useCompany } from '@/contexts/CompanyContext';
import { Card } from '@/components/ui/card';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { useRouter } from 'next/router';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, Sliders } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Status, StockStatus } from '@/types/stock-unit.types';

const statusConfig: Record<string, { label: string; className: string }> = {
  normal: { label: 'Normal', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold' },
  minor_damage: { label: 'Minor Damage', className: 'border-amber-200 bg-amber-50 text-amber-700 font-semibold' },
  major_damage: { label: 'Major Damage', className: 'border-red-200 bg-red-50 text-red-700 font-semibold' },
  returned: { label: 'Retur Beli', className: 'border-purple-200 bg-purple-50 text-purple-700 font-semibold' },
  refunded: { label: 'Refund Jual', className: 'border-orange-200 bg-orange-50 text-orange-700 font-semibold' },
  lost: { label: 'Lost', className: 'border-rose-200 bg-rose-50 text-rose-700 font-semibold' },
  in_repair: { label: 'In Repair', className: 'border-blue-200 bg-blue-50 text-blue-700 font-semibold' },
};

const stockStatusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'border-slate-200 bg-slate-50 text-slate-600 font-medium' },
  cancel: { label: 'Cancel', className: 'border-red-200 bg-red-50 text-red-700 font-medium' },
  rejected: { label: 'Rejected', className: 'border-red-200 bg-red-50 text-red-700 font-medium' },
  prepare: { label: 'Prepare', className: 'border-amber-200 bg-amber-50 text-amber-700 font-medium' },
  inbound_receipt: { label: 'Available', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold' },
};

export default function StockSparepartPage() {
  const router = useRouter();
  const { slug } = router.query;
  const slugStr = typeof slug === 'string' ? slug : '';
  const { companyId } = useCompany();

  // Primary Query Parameters
  const [search, setSearch] = useState('');
  const [hookPage, setHookPage] = useState(1);
  const [hookPerPage, setHookPerPage] = useState(25);
  const [stockState, setStockState] = useState<string | undefined>(undefined);
  const [inStock, setInStock] = useState<boolean | undefined>(undefined);
  const [activityType, setActivityType] = useState<string | undefined>(undefined);
  const [specified, setSpecified] = useState<string | undefined>(undefined);

  // Modal Dialog states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempPerPage, setTempPerPage] = useState('25');
  const [tempStockState, setTempStockState] = useState<string>('all');
  const [tempActivityType, setTempActivityType] = useState<string>('all');
  const [tempInStock, setTempInStock] = useState<string>('all');
  const [tempSpecified, setTempSpecified] = useState<string>('all');

  // Sync temp states when modal opens
  useEffect(() => {
    if (isFilterModalOpen) {
      setTempPerPage(String(hookPerPage));
      setTempStockState(stockState || 'all');
      setTempActivityType(activityType || 'all');
      setTempInStock(inStock === undefined ? 'all' : String(inStock));
      setTempSpecified(specified || 'all');
    }
  }, [isFilterModalOpen, hookPerPage, stockState, activityType, inStock, specified]);

  const handleApplyFilters = () => {
    setHookPerPage(Number(tempPerPage));
    setStockState(tempStockState === 'all' ? undefined : tempStockState);
    setActivityType(tempActivityType === 'all' ? undefined : tempActivityType);
    setInStock(tempInStock === 'all' ? undefined : tempInStock === 'true');
    setSpecified(tempSpecified === 'all' ? undefined : tempSpecified);
    setHookPage(1);
    setIsFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    setTempPerPage('25');
    setTempStockState('all');
    setTempActivityType('all');
    setTempInStock('all');
    setTempSpecified('all');

    // Clear primary state
    setHookPerPage(25);
    setStockState(undefined);
    setActivityType(undefined);
    setInStock(undefined);
    setSpecified(undefined);
    setHookPage(1);
    setIsFilterModalOpen(false);
  };

  const params = useMemo(() => ({
    page: hookPage,
    perPage: hookPerPage,
    search,
    stock_state: stockState,
    in_stock: inStock,
    activity_type: activityType,
    specified: specified,
  }), [hookPage, hookPerPage, search, stockState, inStock, activityType, specified]);

  const { data, isLoading, isError } = useStockSpareparts(companyId, params);

  const columns: ColumnDef<any>[] = [
    {
      header: 'Kode Sparepart',
      accessorKey: 'sparepartCode',
      sortable: true,
      alignment: 'left',
      cell: (item) => <CopyBox text={item.sparepartCode} />,
    },
    {
      header: 'Nama Sparepart',
      accessorKey: 'sparepartName',
      sortable: true,
      alignment: 'left',
      cell: (item) => (
        <ReferenceLink href={`/dashboard/${slugStr}/master/sparepart?search=${item?.sparepartName}`}>
          {item.sparepartName}
        </ReferenceLink>
      ),
    },
    {
      header: 'Kuantitas Stok',
      accessorKey: 'qty',
      sortable: true,
      alignment: 'center',
      cell: (item) => (
        <span className={`font-bold px-2 py-1 rounded text-sm ${item.qty > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
          {item.qty}
        </span>
      ),
    },
    {
      header: 'Harga Estimasi',
      accessorKey: 'price',
      sortable: true,
      alignment: 'right',
      cell: (item) => currenciesFormat('idr', item.price),
    },
    {
      header: 'Status Kondisi',
      accessorKey: 'status',
      sortable: true,
      alignment: 'left',
      cell: (item) => {
        const config = statusConfig[item.status] ?? {
          label: item.status ? item.status.replace(/_/g, ' ') : '-',
          className: 'border-slate-200 bg-slate-50 text-slate-700 font-medium',
        };
        return (
          <Badge variant="outline" className={cn('capitalize font-semibold', config.className)}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      header: 'Kondisi Stok',
      accessorKey: 'stockStatus',
      sortable: true,
      alignment: 'left',
      cell: (item) => {
        const config = stockStatusConfig[item.stockStatus] ?? {
          label: item.stockStatus ? item.stockStatus.replace(/_/g, ' ') : '-',
          className: 'border-slate-200 bg-slate-50 text-slate-700 font-medium',
        };
        return (
          <Badge variant="outline" className={cn('capitalize font-semibold', config.className)}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      header: 'Sub Blok Gudang',
      accessorKey: 'warehouseSubBlock.name',
      sortable: true,
      alignment: 'left',
      cell: (item) => item.warehouseSubBlock?.name || '-',
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader title="Stok Sparepart" subtitle="Kelola dan lacak semua stok sparepart" />
          <LoadingState variant="page" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader title="Stok Sparepart" subtitle="Kelola dan lacak semua stok sparepart" />
          <Card className="rounded-md p-6">
            <div className="text-center text-destructive">Gagal memuat data</div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Stok Sparepart" subtitle="Kelola dan lacak semua stok sparepart" />

        <Card className="rounded-md border p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 max-w-md w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari sparepart..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHookPage(1);
                }}
                className="pl-9 h-10 w-full border-gray-300 bg-white text-gray-900 rounded-lg shadow-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <Select
                value={inStock === undefined ? 'all' : inStock ? 'true' : 'false'}
                onValueChange={(val) => {
                  const nextInStock = val === 'all' ? undefined : val === 'true';
                  setInStock(nextInStock);
                  setHookPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-[180px] border-gray-300 bg-white text-gray-900 rounded-lg shadow-sm">
                  <SelectValue placeholder="Semua Ketersediaan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Ketersediaan</SelectItem>
                  <SelectItem value="true">Tersedia (Qty &gt; 0)</SelectItem>
                  <SelectItem value="false">Kosong (Qty = 0)</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={stockState || 'all'}
                onValueChange={(value) => {
                  const nextStatus = value === 'all' ? undefined : value;
                  setStockState(nextStatus);
                  setHookPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-[180px] border-gray-300 bg-white text-gray-900 rounded-lg shadow-sm">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="process">Proses</SelectItem>
                  <SelectItem value="done">Selesai</SelectItem>
                </SelectContent>
              </Select>

              <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-10 border-gray-300 bg-white hover:bg-slate-50 gap-2 rounded-lg text-slate-700 shadow-sm cursor-pointer">
                    <SlidersHorizontal className="h-4 w-4 text-slate-500" /> Filter Lanjutan
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[440px] p-6 rounded-md">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-slate-800">Filter Lanjutan Stok Sparepart</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                      Saring data stok sparepart berdasarkan preferensi pencarian Anda.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 my-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Tampilkan Data</label>
                        <Select value={tempPerPage} onValueChange={setTempPerPage}>
                          <SelectTrigger className="w-full h-10 border-gray-300 bg-white text-gray-900 rounded-lg">
                            <SelectValue placeholder="Jumlah Baris" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10 data per halaman</SelectItem>
                            <SelectItem value="25">25 data per halaman</SelectItem>
                            <SelectItem value="50">50 data per halaman</SelectItem>
                            <SelectItem value="100">100 data per halaman</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Ketersediaan Stok</label>
                        <Select value={tempInStock} onValueChange={setTempInStock}>
                          <SelectTrigger className="w-full h-10 border-gray-300 bg-white text-gray-900 rounded-lg">
                            <SelectValue placeholder="Ketersediaan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua</SelectItem>
                            <SelectItem value="true">Tersedia (Qty &gt; 0)</SelectItem>
                            <SelectItem value="false">Kosong (Qty = 0)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Kondisi Stok</label>
                        <Select value={tempStockState} onValueChange={setTempStockState}>
                          <SelectTrigger className="w-full h-10 border-gray-300 bg-white text-gray-900 rounded-lg">
                            <SelectValue placeholder="Kondisi Stok" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="process">Proses</SelectItem>
                            <SelectItem value="done">Selesai</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Tipe Aktivitas</label>
                        <Select value={tempActivityType} onValueChange={setTempActivityType}>
                          <SelectTrigger className="w-full h-10 border-gray-300 bg-white text-gray-900 rounded-lg">
                            <SelectValue placeholder="Tipe Aktivitas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua</SelectItem>
                            <SelectItem value="receipt">Receipt (Penerimaan)</SelectItem>
                            <SelectItem value="issue">Issue (Pengeluaran)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Spesifikasi Outstanding</label>
                      <Select value={tempSpecified} onValueChange={setTempSpecified}>
                        <SelectTrigger className="w-full h-10 border-gray-300 bg-white text-gray-900 rounded-lg">
                          <SelectValue placeholder="Pilih Spesifikasi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Data</SelectItem>
                          <SelectItem value="sales_outstanding">Sales Outstanding</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
                    <Button variant="ghost" className="rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 cursor-pointer" onClick={handleResetFilters}>
                      Reset Filter
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" className="rounded-lg cursor-pointer" onClick={() => setIsFilterModalOpen(false)}>
                        Batal
                      </Button>
                      <Button onClick={handleApplyFilters} className="bg-[#1e3a5f] text-white hover:bg-[#152e4d] rounded-lg px-5 cursor-pointer">
                        Terapkan
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <BaseTable
            data={data?.data || []}
            columns={columns}
            loading={isLoading}
            meta={data?.meta}
            onPageChange={(p) => {
              setHookPage(p);
            }}
            onPerPageChange={(pp) => {
              setHookPerPage(pp);
              setHookPage(1);
            }}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
