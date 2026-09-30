'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import type { DateRange } from 'react-day-picker';
import { Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { SearchPagination } from '@/components/ui/search-pagination';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import VehicleEquipmentTransactionTable from '@/components/features/vehicle-equipment-transaction/VehicleEquipmentTransactionTable';
import { useCompany } from '@/contexts/CompanyContext';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { useDeleteVehicleEquipmentTransaction, useVehicleEquipmentTransactions } from '@/hooks/useVehicleEquipmentTransaction';

export default function SalesVehicleEquipmentPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { companyId } = useCompany();
  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('transaction:create');
  const canEdit = hasPermission('transaction:edit');
  const canDelete = hasPermission('transaction:delete');
  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 25 });
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError, error, isFetching } = useVehicleEquipmentTransactions({
    page,
    perPage,
    search: search || undefined,
    type: 'sales',
    company_id: companyId ?? null,
    start_date: startDate,
    end_date: endDate,
  });
  const deleteMutation = useDeleteVehicleEquipmentTransaction();

  const dateRange = useMemo<DateRange | undefined>(() => {
    if (!startDate && !endDate) return undefined;
    return { from: startDate ? new Date(startDate) : undefined, to: endDate ? new Date(endDate) : undefined };
  }, [endDate, startDate]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setStartDate(range?.from ? range.from.toISOString().slice(0, 10) : null);
    setEndDate(range?.to ? range.to.toISOString().slice(0, 10) : null);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await deleteMutation.mutateAsync(selectedId);
      toast.success('Data berhasil dihapus');
      setSelectedId(null);
      setPage(1);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus data');
    }
  };

  const apiErrorMessage = (error as { message?: string } | null)?.message || 'Gagal memuat data penjualan perlengkapan';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Penjualan Perlengkapan" subtitle="Kelola transaksi penjualan perlengkapan kendaraan" />
        {isLoading ? (
          <LoadingState variant="page" />
        ) : isError ? (
          <div className="rounded-md border bg-white p-8 text-center text-red-500">{apiErrorMessage}</div>
        ) : (
          <SearchPagination
            searchValue={search}
            onSearchChange={(value) => { setSearch(value); setPage(1); }}
            searchPlaceholder="Cari penjualan perlengkapan..."
            searchAriaLabel="Cari penjualan perlengkapan"
            page={page}
            perPage={perPage}
            total={data?.meta?.total}
            lastPage={data?.meta?.lastPage}
            onPageChange={setPage}
            onPerPageChange={(value) => { setPerPage(value); setPage(1); }}
            filters={<DatePickerWithRange date={dateRange} onChange={handleDateRangeChange} className="w-full sm:w-[260px]" />}
            actions={canCreate ? (
              <Button onClick={() => router.push(`/dashboard/${slug}/transaksi/penjualan-perlengkapan/create`)} className="btn-primary!">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Data
              </Button>
            ) : null}
          >
            <VehicleEquipmentTransactionTable
              data={data?.data ?? []}
              slug={slug}
              type="sales"
              onDelete={setSelectedId}
              canEdit={canEdit}
              canDelete={canDelete}
              loading={isLoading || isFetching}
            />
          </SearchPagination>
        )}
      </div>

      <Dialog open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Hapus Penjualan Perlengkapan</DialogTitle>
            <DialogDescription>Data yang dihapus tidak dapat dikembalikan.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedId(null)} disabled={deleteMutation.isPending}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
