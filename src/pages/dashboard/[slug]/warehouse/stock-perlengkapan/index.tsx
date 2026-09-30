import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { Card } from '@/components/ui/card';
import { SearchPagination } from '@/components/ui/search-pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StockVehicleEquipmentTable from '@/components/features/vehicle-equipment-warehouse/StockVehicleEquipmentTable';
import { useCompany } from '@/contexts/CompanyContext';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { useStockVehicleEquipments } from '@/hooks/useStockVehicleEquipment';

export default function StockVehicleEquipmentPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { companyId } = useCompany();
  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 25 });
  const [inStock, setInStock] = useState<boolean>();
  const [activityType, setActivityType] = useState<string>();
  const [specified, setSpecified] = useState<string>();

  const params = useMemo(() => ({
    page,
    perPage,
    search,
    in_stock: inStock,
    activity_type: activityType,
    specified,
  }), [activityType, inStock, page, perPage, search, specified]);

  const { data, isLoading, isError, isFetching } = useStockVehicleEquipments(companyId, params);

  const pageHeader = <PageHeader title="Stok Perlengkapan" subtitle="Pantau stok dan status perlengkapan kendaraan di warehouse." />;

  if (isLoading) {
    return <DashboardLayout><div className="space-y-6">{pageHeader}<LoadingState variant="page" /></div></DashboardLayout>;
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {pageHeader}
          <Card className="rounded-lg border-rose-100 p-8 text-center">
            <p className="font-medium text-destructive">Gagal memuat data stok perlengkapan</p>
            <p className="mt-1 text-sm text-slate-500">Silakan muat ulang halaman atau coba beberapa saat lagi.</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const filters = (
    <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
      <Select value={inStock === undefined ? 'all' : String(inStock)} onValueChange={(value) => { setInStock(value === 'all' ? undefined : value === 'true'); setPage(1); }}>
        <SelectTrigger className="h-10 w-full border-slate-300 bg-white shadow-sm sm:w-[180px]" aria-label="Filter ketersediaan stok">
          <SelectValue placeholder="Semua ketersediaan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua ketersediaan</SelectItem>
          <SelectItem value="true">Tersedia</SelectItem>
          <SelectItem value="false">Stok kosong</SelectItem>
        </SelectContent>
      </Select>

      <Select value={activityType ?? 'all'} onValueChange={(value) => { setActivityType(value === 'all' ? undefined : value); setPage(1); }}>
        <SelectTrigger className="h-10 w-full border-slate-300 bg-white shadow-sm sm:w-[170px]" aria-label="Filter aktivitas">
          <SelectValue placeholder="Semua aktivitas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua aktivitas</SelectItem>
          <SelectItem value="receipt">Penerimaan</SelectItem>
          <SelectItem value="issue">Pengeluaran</SelectItem>
        </SelectContent>
      </Select>

      <Select value={specified ?? 'all'} onValueChange={(value) => { setSpecified(value === 'all' ? undefined : value); setPage(1); }}>
        <SelectTrigger className="h-10 w-full border-slate-300 bg-white shadow-sm sm:w-[190px]" aria-label="Filter outstanding">
          <SelectValue placeholder="Semua data" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua data</SelectItem>
          <SelectItem value="purchase_outstanding">Outstanding Beli</SelectItem>
          <SelectItem value="sales_outstanding">Outstanding Jual</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {pageHeader}
        <SearchPagination
          searchValue={search}
          onSearchChange={(value) => { setSearch(value); setPage(1); }}
          searchPlaceholder="Cari kode atau nama perlengkapan..."
          searchAriaLabel="Cari stok perlengkapan"
          page={page}
          perPage={perPage}
          total={data?.meta?.total}
          lastPage={data?.meta?.lastPage}
          onPageChange={setPage}
          onPerPageChange={(value) => { setPerPage(value); setPage(1); }}
          actions={filters}
        >
          <StockVehicleEquipmentTable data={data?.data ?? []} slug={slug} isLoading={isFetching} />
        </SearchPagination>
      </div>
    </DashboardLayout>
  );
}
