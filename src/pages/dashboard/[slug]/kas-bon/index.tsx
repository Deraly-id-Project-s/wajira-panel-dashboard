import * as React from 'react';
import Head from 'next/head';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/router';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import type { DriverCashAdvance } from '@/@types/driver-cash-advance.types';
import { KasBonApprovalDialog } from '@/components/features/kas-bon/KasBonApprovalDialog';
import { KasBonDeleteDialog } from '@/components/features/kas-bon/KasBonDeleteDialog';
import { KasBonTable } from '@/components/features/kas-bon/KasBonTable';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { PageHeader } from '@/components/ui/page-header';
import { SearchPagination } from '@/components/ui/search-pagination';
import { useCompany } from '@/contexts/CompanyContext';
import {
  useApproveDriverCashAdvance,
  useDeleteDriverCashAdvance,
  useDriverCashAdvances,
} from '@/hooks/useDriverCashAdvance';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';

export default function KasBonPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { companyId } = useCompany();
  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('transaction:create');
  const canEdit = hasPermission('transaction:edit');
  const canDelete = hasPermission('transaction:delete');

  const { page, perPage, search, setPage, setPerPage, setSearch, updateQuery } = useQueryParamsTable({
    defaultPerPage: 25,
  });
  const [searchInput, setSearchInput] = React.useState(search);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [selectedItem, setSelectedItem] = React.useState<DriverCashAdvance | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [approvalOpen, setApprovalOpen] = React.useState(false);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
      }
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search, searchInput, setSearch]);

  const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null;
  const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null;

  const listQuery = useDriverCashAdvances({
    page,
    perPage,
    search,
    sort_by: 'created_at',
    sort_order: 'desc',
    company_id: companyId ?? undefined,
    start_date: startDate,
    end_date: endDate,
    enabled: Boolean(companyId),
  });
  const deleteMutation = useDeleteDriverCashAdvance();
  const approveMutation = useApproveDriverCashAdvance();

  const tableData = listQuery.data?.data ?? [];

  const handleAdd = React.useCallback(() => {
    if (!slug) return;
    void router.push(`/dashboard/${slug}/kas-bon/create`);
  }, [router, slug]);

  const handleEdit = React.useCallback(
    (item: DriverCashAdvance) => {
      if (!slug) return;
      void router.push(`/dashboard/${slug}/kas-bon/edit/${item.id}`);
    },
    [router, slug],
  );

  const handleDeleteClick = React.useCallback((item: DriverCashAdvance) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  }, []);

  const handleApproveClick = React.useCallback((item: DriverCashAdvance) => {
    setSelectedItem(item);
    setApprovalOpen(true);
  }, []);

  const handleDelete = React.useCallback(async () => {
    if (!selectedItem) return;

    try {
      await deleteMutation.mutateAsync(selectedItem.id);
      toast.success('Kas bon berhasil dihapus');
      setDeleteOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus kas bon');
    }
  }, [deleteMutation, selectedItem]);

  const handleApprove = React.useCallback(async () => {
    if (!selectedItem) return;

    try {
      await approveMutation.mutateAsync({
        id: selectedItem.id,
        payload: {
          is_approve: true,
          approve_date: format(new Date(), 'yyyy-MM-dd'),
        },
      });
      toast.success('Kas bon berhasil diapprove');
      setApprovalOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast.error(error.message || 'Gagal approve kas bon');
    }
  }, [approveMutation, selectedItem]);

  return (
    <DashboardLayout>
      <Head>
        <title>Kas Bon - Wajira Dashboard</title>
      </Head>

      <div className="space-y-6">
        <PageHeader
          title="Kas Bon"
          subtitle="Kelola pengajuan kas bon driver"
        />

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Cari kas bon..."
          searchAriaLabel="Cari kas bon"
          page={page}
          perPage={perPage}
          total={listQuery.data?.meta.total}
          lastPage={listQuery.data?.meta.lastPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          filters={
            <DatePickerWithRange
              date={dateRange}
              onChange={(range) => {
                setDateRange(range);
                setPage(1);
              }}
              className="w-full sm:w-[260px]"
            />
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {search && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchInput('');
                    updateQuery({ search: undefined, page: 1 });
                  }}
                  className="h-9 rounded-md border-slate-200 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Reset
                </Button>
              )}
              {listQuery.isFetching && (
                <span className="text-xs font-medium text-slate-400 animate-pulse">
                  Memperbarui data...
                </span>
              )}
              <Button type="button" onClick={handleAdd} disabled={!canCreate} className="btn-primary!">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Data
              </Button>
            </div>
          }
        >
          <KasBonTable
            data={tableData}
            isLoading={!listQuery.data}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onApprove={handleApproveClick}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </SearchPagination>
      </div>

      <KasBonApprovalDialog
        open={approvalOpen}
        onOpenChange={setApprovalOpen}
        onConfirm={handleApprove}
        isApproving={approveMutation.isPending}
        itemName={selectedItem?.subject}
      />

      <KasBonDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        itemName={selectedItem?.subject}
      />
    </DashboardLayout>
  );
}
