import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { SlidersHorizontal } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import StockSparepartFilterDialog, {
  type StockSparepartFilterDraft,
} from '@/components/features/stock-sparepart/StockSparepartFilterDialog';
import StockSparepartTable from '@/components/features/stock-sparepart/StockSparepartTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { SearchPagination } from '@/components/ui/search-pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompany } from '@/contexts/CompanyContext';
import { useStockSpareparts } from '@/hooks/useStockSparepart';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';

const defaultFilterDraft: StockSparepartFilterDraft = {
  perPage: '25',
  stockState: 'all',
  activityType: 'all',
  inStock: 'all',
  specified: 'all',
};

export default function StockSparepartPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { companyId } = useCompany();
  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 25 });

  const [stockState, setStockState] = useState<string>();
  const [inStock, setInStock] = useState<boolean>();
  const [activityType, setActivityType] = useState<string>();
  const [specified, setSpecified] = useState<string>();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState<StockSparepartFilterDraft>(defaultFilterDraft);

  useEffect(() => {
    if (!isFilterModalOpen) return;
    setFilterDraft({
      perPage: String(perPage),
      stockState: stockState ?? 'all',
      activityType: activityType ?? 'all',
      inStock: inStock === undefined ? 'all' : String(inStock),
      specified: specified ?? 'all',
    });
  }, [activityType, inStock, isFilterModalOpen, perPage, specified, stockState]);

  const params = useMemo(() => ({
    page,
    perPage,
    search,
    stock_state: stockState,
    in_stock: inStock,
    activity_type: activityType,
    specified,
  }), [activityType, inStock, page, perPage, search, specified, stockState]);

  const { data, isLoading, isError, isFetching } = useStockSpareparts(companyId, params);

  const activeFilterCount = [stockState, inStock === undefined ? undefined : inStock, activityType, specified]
    .filter((value) => value !== undefined).length;

  const applyFilters = () => {
    setPerPage(Number(filterDraft.perPage));
    setStockState(filterDraft.stockState === 'all' ? undefined : filterDraft.stockState);
    setActivityType(filterDraft.activityType === 'all' ? undefined : filterDraft.activityType);
    setInStock(filterDraft.inStock === 'all' ? undefined : filterDraft.inStock === 'true');
    setSpecified(filterDraft.specified === 'all' ? undefined : filterDraft.specified);
    setPage(1);
    setIsFilterModalOpen(false);
  };

  const resetFilters = () => {
    setFilterDraft(defaultFilterDraft);
    setPerPage(25);
    setStockState(undefined);
    setActivityType(undefined);
    setInStock(undefined);
    setSpecified(undefined);
    setPage(1);
    setIsFilterModalOpen(false);
  };

  const pageHeader = (
    <PageHeader
      title="Stok Sparepart"
      subtitle="Pantau ketersediaan, kondisi, dan lokasi seluruh sparepart gudang."
    />
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">{pageHeader}<LoadingState variant="page" /></div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {pageHeader}
          <Card className="rounded-lg border-rose-100 p-8 text-center">
            <p className="font-medium text-destructive">Gagal memuat data stok sparepart</p>
            <p className="mt-1 text-sm text-slate-500">Silakan muat ulang halaman atau coba beberapa saat lagi.</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const filters = (
    <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
      <Select
        value={inStock === undefined ? 'all' : String(inStock)}
        onValueChange={(value) => {
          setInStock(value === 'all' ? undefined : value === 'true');
          setPage(1);
        }}
      >
        <SelectTrigger className="h-10 w-full border-slate-300 bg-white shadow-sm sm:w-[180px]" aria-label="Filter ketersediaan stok">
          <SelectValue placeholder="Semua ketersediaan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua ketersediaan</SelectItem>
          <SelectItem value="true">Tersedia</SelectItem>
          <SelectItem value="false">Stok kosong</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={stockState ?? 'all'}
        onValueChange={(value) => {
          setStockState(value === 'all' ? undefined : value);
          setPage(1);
        }}
      >
        <SelectTrigger className="h-10 w-full border-slate-300 bg-white shadow-sm sm:w-[160px]" aria-label="Filter kondisi stok">
          <SelectValue placeholder="Semua status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua status</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="process">Proses</SelectItem>
          <SelectItem value="done">Selesai</SelectItem>
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="outline"
        className="h-10 gap-2 border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
        onClick={() => setIsFilterModalOpen(true)}
      >
        <SlidersHorizontal className="h-4 w-4 text-slate-500" />
        Filter Lanjutan
        {activeFilterCount > 0 && (
          <Badge className="h-5 min-w-5 justify-center rounded-full bg-orange-100 px-1.5 text-orange-700 hover:bg-orange-100">
            {activeFilterCount}
          </Badge>
        )}
      </Button>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {pageHeader}
        <SearchPagination
          searchValue={search}
          onSearchChange={(value) => { setSearch(value); setPage(1); }}
          searchPlaceholder="Cari kode atau nama sparepart..."
          searchAriaLabel="Cari stok sparepart"
          page={page}
          perPage={perPage}
          total={data?.meta?.total}
          lastPage={data?.meta?.lastPage}
          onPageChange={setPage}
          onPerPageChange={(value) => { setPerPage(value); setPage(1); }}
          actions={filters}
        >
          <StockSparepartTable data={data?.data || []} slug={slug} isLoading={isFetching} />
        </SearchPagination>
      </div>

      <StockSparepartFilterDialog
        open={isFilterModalOpen}
        value={filterDraft}
        onOpenChange={setIsFilterModalOpen}
        onChange={setFilterDraft}
        onReset={resetFilters}
        onApply={applyFilters}
      />
    </DashboardLayout>
  );
}
