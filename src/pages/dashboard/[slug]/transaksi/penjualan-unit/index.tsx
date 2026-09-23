'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SalesTable } from '@/components/features/unit-transaksi/sales/SalesTable';
import DeleteUnitTransactionDialog from '@/components/features/unit-transaksi/DeleteUnitTransactionDialog';
import SearchVehicleModal from '@/components/features/vehicle/SearchVehicleModal';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { SearchPagination } from '@/components/ui/search-pagination';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { useDeleteSales, useSalesList } from '@/hooks/useSales';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useCompany } from '@/contexts/CompanyContext';
import { companyQueryKeys } from '@/lib/query/company-key';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function SalesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('transaction:create');
  const canEdit = hasPermission('transaction:edit');
  const canDelete = hasPermission('transaction:delete');

  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 25 });
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [isVehicleSearchOpen, setIsVehicleSearchOpen] = useState(false);

  const { data, isLoading, isError, error, isFetching } = useSalesList({
    page,
    perPage,
    search: search || undefined,
    start_date: startDate,
    end_date: endDate,
  });

  const deleteMutation = useDeleteSales();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dateRange = useMemo<DateRange | undefined>(() => {
    if (!startDate && !endDate) return undefined;
    return {
      from: startDate ? new Date(startDate) : undefined,
      to: endDate ? new Date(endDate) : undefined,
    };
  }, [startDate, endDate]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    const start = range?.from ? range.from.toISOString().slice(0, 10) : null;
    const end = range?.to ? range.to.toISOString().slice(0, 10) : null;
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await deleteMutation.mutateAsync(selectedId);
      if (companyId) {
        await queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
      } else {
        await queryClient.invalidateQueries({ queryKey: ['sales-transactions'] });
      }
      toast.success('Data berhasil dihapus');
      setSelectedId(null);
      setPage(1);
    } catch {
      toast.error('Gagal menghapus data');
    }
  };

  const apiErrorMessage = useMemo(() => {
    if (!isError) return '';
    const err = error as { message?: string } | null;
    return err?.message || 'Gagal memuat data penjualan unit';
  }, [error, isError]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Penjualan Unit" subtitle="Kelola dan lacak semua penjualan unit" />

        <div className="space-y-4">
          {isLoading ? (
            <LoadingState variant="page" />
          ) : isError ? (
            <div className="bg-white rounded-md border p-8 text-center text-red-500">{apiErrorMessage}</div>
          ) : (
            <SearchPagination
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Cari penjualan unit..."
              searchAriaLabel="Cari transaksi penjualan unit"
              page={page}
              perPage={perPage}
              total={data?.meta?.total}
              lastPage={data?.meta?.lastPage}
              onPageChange={setPage}
              onPerPageChange={setPerPage}
              filters={(
                <DatePickerWithRange
                  date={dateRange}
                  onChange={handleDateRangeChange}
                  className="w-full sm:w-[260px]"
                />
              )}
              actions={(
                <>
                  <Button
                    type="button"
                    variant="outline"
                    tooltip="gunakan fitur ini untuk mencari data detail tipe unit berdasarkan No. Rangka, No. Mesin, Warna"
                    onClick={() => setIsVehicleSearchOpen(true)}
                  >
                    Cari Data Kendaraan
                  </Button>
                  {canCreate && (
                    <Button onClick={() => router.push(`/dashboard/${slug}/transaksi/penjualan-unit/create`)} className="btn-primary!">
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Data
                    </Button>
                  )}
                </>
              )}
            >
              <SalesTable
                data={data?.data ?? []}
                slug={slug}
                onDelete={(id) => setSelectedId(id)}
                canEdit={canEdit}
                canDelete={canDelete}
                loading={isLoading || isFetching}
              />
            </SearchPagination>
          )}
        </div>

        <SearchVehicleModal open={isVehicleSearchOpen} onOpenChange={setIsVehicleSearchOpen} type="sales" />
        <DeleteUnitTransactionDialog open={!!selectedId} onClose={() => setSelectedId(null)} onConfirm={handleDelete} loading={deleteMutation.isPending} />
      </div>
    </DashboardLayout>
  );
}
