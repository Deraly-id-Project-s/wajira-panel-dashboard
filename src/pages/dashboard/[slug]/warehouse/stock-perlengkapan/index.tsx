import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { Card } from '@/components/ui/card';
import { SearchPagination } from '@/components/ui/search-pagination';
import StockVehicleEquipmentTable from '@/components/features/vehicle-equipment-warehouse/StockVehicleEquipmentTable';
import { useCompany } from '@/contexts/CompanyContext';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { useStockVehicleEquipments } from '@/hooks/useStockVehicleEquipment';

export default function StockVehicleEquipmentPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { companyId } = useCompany();
  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 25 });

  const params = useMemo(() => ({
    page,
    perPage,
    search,
  }), [page, perPage, search]);

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
        >
          <StockVehicleEquipmentTable data={data?.data ?? []} slug={slug} isLoading={isFetching} />
        </SearchPagination>
      </div>
    </DashboardLayout>
  );
}
