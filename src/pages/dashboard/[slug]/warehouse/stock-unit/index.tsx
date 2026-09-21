import { LoadingState } from '@/components/ui/loading-state';
import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import StockUnitTable from '@/components/features/stock-unit/StockUnitTable';
import StockUnitFilterDropdown from '@/components/features/stock-unit/StockUnitFilterTabs';
import { useStockUnits } from '@/hooks/useStockUnit';
import { useCompany } from '@/contexts/CompanyContext';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { StockStatus } from '@/@types/stock-unit.types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SlidersHorizontal } from 'lucide-react';
import { SearchPagination } from '@/components/ui/search-pagination';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { SearchInput } from '@/components/ui/search-input';

export default function StockUnitPage() {
  const { companyId } = useCompany();

  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 25 });

  // Primary Query Parameters
  const [stockState, setStockState] = useState<StockStatus | undefined>(undefined);
  const [inStock, setInStock] = useState<boolean | undefined>(undefined);
  const [activityType, setActivityType] = useState<string | undefined>(undefined);
  const [unitTransactionItemId, setUnitTransactionItemId] = useState<string | undefined>(undefined);
  const [machineNumber, setMachineNumber] = useState<string | undefined>(undefined);
  const [chassisNumber, setChassisNumber] = useState<string | undefined>(undefined);
  const [color, setColor] = useState<string | undefined>(undefined);
  const [specified, setSpecified] = useState<string | undefined>(undefined);

  // Modal Dialog states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempPerPage, setTempPerPage] = useState('25');
  const [tempStockState, setTempStockState] = useState<string>('all');
  const [tempActivityType, setTempActivityType] = useState<string>('all');
  const [tempInStock, setTempInStock] = useState<string>('all');
  const [tempUnitTransactionItemId, setTempUnitTransactionItemId] = useState('');
  const [tempMachineNumber, setTempMachineNumber] = useState('');
  const [tempChassisNumber, setTempChassisNumber] = useState('');
  const [tempColor, setTempColor] = useState('');
  const [tempSpecified, setTempSpecified] = useState<string>('all');

  // Sync temp states when modal opens
  useEffect(() => {
    if (isFilterModalOpen) {
      setTempPerPage(String(perPage));
      setTempStockState(stockState || 'all');
      setTempActivityType(activityType || 'all');
      setTempInStock(inStock === undefined ? 'all' : String(inStock));
      setTempUnitTransactionItemId(unitTransactionItemId || '');
      setTempMachineNumber(machineNumber || '');
      setTempChassisNumber(chassisNumber || '');
      setTempColor(color || '');
      setTempSpecified(specified || 'all');
    }
  }, [isFilterModalOpen, perPage, stockState, activityType, inStock, unitTransactionItemId, machineNumber, chassisNumber, color, specified]);

  const handleApplyFilters = () => {
    setPerPage(Number(tempPerPage));
    setStockState(tempStockState === 'all' ? undefined : (tempStockState as StockStatus));
    setActivityType(tempActivityType === 'all' ? undefined : tempActivityType);
    setInStock(tempInStock === 'all' ? undefined : tempInStock === 'true');
    setUnitTransactionItemId(tempUnitTransactionItemId || undefined);
    setMachineNumber(tempMachineNumber || undefined);
    setChassisNumber(tempChassisNumber || undefined);
    setColor(tempColor || undefined);
    setSpecified(tempSpecified === 'all' ? undefined : tempSpecified);
    setPage(1);
    setIsFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    setTempPerPage('25');
    setTempStockState('all');
    setTempActivityType('all');
    setTempInStock('all');
    setTempUnitTransactionItemId('');
    setTempMachineNumber('');
    setTempChassisNumber('');
    setTempColor('');
    setTempSpecified('all');

    // Clear primary state
    setPerPage(25);
    setStockState(undefined);
    setActivityType(undefined);
    setInStock(undefined);
    setUnitTransactionItemId(undefined);
    setMachineNumber(undefined);
    setChassisNumber(undefined);
    setColor(undefined);
    setSpecified(undefined);
    setPage(1);
    setIsFilterModalOpen(false);
  };

  const params = useMemo(() => ({
    page,
    perPage,
    search: search,
    stock_state: stockState,
    in_stock: inStock,
    activity_type: activityType,
    unit_transaction_item_id: unitTransactionItemId,
    machine_number: machineNumber,
    chassis_number: chassisNumber,
    color: color,
    specified: specified,
  }), [page, perPage, search, stockState, inStock, activityType, unitTransactionItemId, machineNumber, chassisNumber, color, specified]);

  const { data, isLoading, isError, isFetching } = useStockUnits(companyId, params);

  const isDataLoading = isLoading || isFetching;


  if (isError) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader title="Data Unit Stok" subtitle="Kelola dan lacak semua unit stok" />
          <Card className="rounded-md p-6">
            <div className="text-center text-destructive">Gagal memuat data</div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const filters = (
    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
      <Select
        value={inStock === undefined ? 'all' : inStock ? 'true' : 'false'}
        onValueChange={(val) => {
          const nextInStock = val === 'all' ? undefined : val === 'true';
          setInStock(nextInStock);
          setPage(1);
        }}
      >
        <SelectTrigger className="h-10 w-[160px] border-gray-300 bg-white text-gray-900 rounded-md shadow-sm">
          <SelectValue placeholder="Semua Ketersediaan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Stok</SelectItem>
          <SelectItem value="true">Tersedia (In Stock)</SelectItem>
          <SelectItem value="false">Tidak Tersedia</SelectItem>
        </SelectContent>
      </Select>
      <StockUnitFilterDropdown
        active={(stockState as StockStatus) ?? 'all'}
        onChange={(value) => {
          const nextStatus = value === 'all' ? undefined : value;
          setStockState(nextStatus);
          setPage(1);
        }}
      />
      <Button variant="outline" onClick={() => setIsFilterModalOpen(true)} className="h-10 border-gray-300 bg-white hover:bg-slate-50 gap-2 rounded-md text-slate-700 shadow-sm cursor-pointer">
        <SlidersHorizontal className="h-4 w-4 text-slate-500" /> Filter Lanjutan
      </Button>
    </div>
  );

  const searchFilters = (
    <div className="flex gap-2 w-full sm:w-auto flex-col sm:flex-row">
      <SearchInput
        searchValue={machineNumber}
        onSearchChange={(val) => {
          setMachineNumber(val || undefined);
          setPage(1);
        }}
        placeholder="Nomor Mesin"
        aria-label="Cari nomor mesin"
        wrapperClassName="sm:w-[200px]"
      />
      <SearchInput
        searchValue={chassisNumber}
        onSearchChange={(val) => {
          setChassisNumber(val || undefined);
          setPage(1);
        }}
        placeholder="Nomor Rangka"
        aria-label="Cari nomor rangka"
        wrapperClassName="sm:w-[200px]"
      />
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Data Unit Stok" subtitle="Kelola dan lacak semua unit stok" />
        <SearchPagination
          hideSearch={true}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari unit stok"
          page={page}
          perPage={perPage}
          total={data?.meta?.total}
          lastPage={data?.meta?.lastPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          actions={filters}
          filters={searchFilters}
        >
          <StockUnitTable
            data={data?.data || []}
            isLoading={isDataLoading}
          />
        </SearchPagination>
      </div>

      <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 rounded-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">Filter Lanjutan Stok Unit</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Saring data stok unit berdasarkan preferensi pencarian Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Tampilkan Data</label>
                <Select value={tempPerPage} onValueChange={setTempPerPage}>
                  <SelectTrigger className="w-full h-10 border-gray-300 bg-white text-gray-900 rounded-md">
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
                  <SelectTrigger className="w-full h-10 border-gray-300 bg-white text-gray-900 rounded-md">
                    <SelectValue placeholder="Ketersediaan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="true">Tersedia (In Stock)</SelectItem>
                    <SelectItem value="false">Tidak Tersedia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Status Kondisi (Kondisi Stok)</label>
                <Select value={tempStockState} onValueChange={setTempStockState}>
                  <SelectTrigger className="w-full h-10 border-gray-300 bg-white text-gray-900 rounded-md">
                    <SelectValue placeholder="Status Kondisi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="process">Proses</SelectItem>
                    <SelectItem value="done">Selesai / Normal</SelectItem>
                    <SelectItem value="minor_damage">Minor Damage</SelectItem>
                    <SelectItem value="major_damage">Major Damage</SelectItem>
                    <SelectItem value="returned">Retur Beli</SelectItem>
                    <SelectItem value="refunded">Refund Jual</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="in_repair">In Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Tipe Aktivitas</label>
                <Select value={tempActivityType} onValueChange={setTempActivityType}>
                  <SelectTrigger className="w-full h-10 border-gray-300 bg-white text-gray-900 rounded-md">
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
                <SelectTrigger className="w-full h-10 border-gray-300 bg-white text-gray-900 rounded-md">
                  <SelectValue placeholder="Pilih Spesifikasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Data</SelectItem>
                  <SelectItem value="sales_outstanding">Sales Outstanding</SelectItem>
                  <SelectItem value="purchase_outstanding">Purchase Outstanding</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Warna Unit</label>
                <Input
                  placeholder="Contoh: Hitam"
                  value={tempColor}
                  onChange={(e) => setTempColor(e.target.value)}
                  className="h-10 border-gray-300 rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">ID Item Transaksi Unit</label>
                <Input
                  type="number"
                  placeholder="ID Item"
                  value={tempUnitTransactionItemId}
                  onChange={(e) => setTempUnitTransactionItemId(e.target.value)}
                  className="h-10 border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Nomor Mesin</label>
              <Input
                placeholder="Contoh: ENG40158"
                value={tempMachineNumber}
                onChange={(e) => setTempMachineNumber(e.target.value)}
                className="h-10 border-gray-300 rounded-md animate-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Nomor Rangka</label>
              <Input
                placeholder="Contoh: KTR3283242922"
                value={tempChassisNumber}
                onChange={(e) => setTempChassisNumber(e.target.value)}
                className="h-10 border-gray-300 rounded-md animate-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
            <Button variant="ghost" className="rounded-md text-rose-600 hover:text-rose-800 hover:bg-rose-50 cursor-pointer" onClick={handleResetFilters}>
              Reset Filter
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-md cursor-pointer" onClick={() => setIsFilterModalOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleApplyFilters} className="rounded-md px-5 cursor-pointer btn-primary-orange!">
                Terapkan
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
