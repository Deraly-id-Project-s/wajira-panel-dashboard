'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import SalesSparepartTable from '@/components/features/sparepart-transaction/SalesSparepartTable';
import DeleteSalesSparepartDialog from '@/components/features/sparepart-transaction/DeleteSalesSparepartDialog';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { SearchPagination } from '@/components/ui/search-pagination';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { useSparepartTransactions, useDeleteSparepartTransaction } from '@/hooks/useSparepartTransaction';
import { useRouter } from 'next/router';
import { useCompany } from '@/contexts/CompanyContext';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function SalesSparepartPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('transaction:create');
  const canEdit = hasPermission('transaction:edit');
  const canDelete = hasPermission('transaction:delete');

  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 25 });
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const { data, isLoading, isError, error, isFetching } = useSparepartTransactions({
    page,
    perPage,
    search: search || undefined,
    type: 'sales',
    company_id: companyId ?? null,
    start_date: startDate,
    end_date: endDate,
  });

  const deleteMutation = useDeleteSparepartTransaction();
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
    return err?.message || 'Gagal memuat data penjualan sparepart';
  }, [error, isError]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Penjualan Sparepart"
          subtitle="Kelola dan lacak semua transaksi penjualan sparepart"
        />

        <div className="space-y-4">
          {isLoading ? (
            <LoadingState variant="page" />
          ) : isError ? (
            <div className="bg-white rounded-md border p-8 text-center text-red-500">{apiErrorMessage}</div>
          ) : (
            <SearchPagination
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Cari penjualan sparepart..."
              searchAriaLabel="Cari transaksi penjualan sparepart"
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
              actions={
                canCreate ? (
                  <Button
                    onClick={() => router.push(`/dashboard/${slug}/transaksi/penjualan-sparepart/create`)}
                    className="btn-primary!"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Data
                  </Button>
                ) : null
              }
            >
              <SalesSparepartTable
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

        <DeleteSalesSparepartDialog
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
          onConfirm={handleDelete}
          loading={deleteMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
