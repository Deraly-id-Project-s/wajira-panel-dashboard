import * as React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import type { OrderList, OrderListStatus } from '@/@types/order-list.types';
import { OrderListDeleteDialog } from '@/components/features/order-list/OrderListDeleteDialog';
import { OrderListTable } from '@/components/features/order-list/OrderListTable';
import { OrderStatusConfirmDialog } from '@/components/features/order-list/OrderStatusConfirmDialog';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useOrderLists, useDeleteOrderList, useUpdateOrderListState } from '@/hooks/useOrderList';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { PageHeader } from '@/components/ui/page-header';
import { useCompany } from '@/contexts/CompanyContext';

export default function OrderListPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { companyId } = useCompany();

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('transaction:create');
  const canEdit = hasPermission('transaction:edit');
  const canDelete = hasPermission('transaction:delete');

  const initialPage = typeof router.query.page === 'string' ? Number(router.query.page) : 1;
  const initialPerPage = typeof router.query.perPage === 'string'
    ? Number(router.query.perPage)
    : typeof router.query.per_page === 'string'
      ? Number(router.query.per_page)
      : 25;
  const initialSearch = typeof router.query.search === 'string' ? router.query.search : '';
  const [page, setPage] = React.useState(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1);
  const [perPage, setPerPage] = React.useState(25);
  const [searchInput, setSearchInput] = React.useState(initialSearch);
  const [search, setSearch] = React.useState(initialSearch);
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<OrderList | null>(null);
  const [statusConfirmOpen, setStatusConfirmOpen] = React.useState(false);
  const [statusUpdateData, setStatusUpdateData] = React.useState<{ item: OrderList; newStatus: OrderListStatus } | null>(null);

  React.useEffect(() => {
    setSearch(debouncedSearch.trim());
    setPage(1);
  }, [debouncedSearch]);

  const listQueryParams = React.useMemo(
    () => ({
      page,
      perPage,
      search,
      order_by: 'created_at' as const,
      order_sort: 'desc' as const,
      company_id: companyId ?? undefined,
      enabled: Boolean(companyId),
    }),
    [companyId, page, perPage, search],
  );

  const listQuery = useOrderLists(listQueryParams);
  const deleteMutation = useDeleteOrderList();
  const updateMutation = useUpdateOrderListState();
  const tableData = listQuery.data?.data ?? [];

  const handleDelete = React.useCallback(async () => {
    if (!selectedItem) return;

    try {
      await deleteMutation.mutateAsync(selectedItem.id);
      toast.success('Order list berhasil dihapus');
      setDeleteOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus order list');
    }
  }, [selectedItem, deleteMutation]);

  const handleUpdateStatus = React.useCallback((item: OrderList, newStatus: OrderListStatus) => {
    setStatusUpdateData({ item, newStatus });
    setStatusConfirmOpen(true);
  }, []);

  const handleConfirmUpdateStatus = React.useCallback(async () => {
    if (!statusUpdateData) return;
    const { item, newStatus } = statusUpdateData;

    try {
      await updateMutation.mutateAsync({
        id: item.id,
        payload: { status: newStatus },
      });
      toast.success('Status berhasil diperbarui');
      setStatusConfirmOpen(false);
      setStatusUpdateData(null);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui status');
    }
  }, [statusUpdateData, updateMutation]);

  const handleAdd = React.useCallback(() => {
    if (!slug) return;
    void router.push(`/dashboard/${slug}/administrasi/order-list/create`);
  }, [slug, router]);

  const navigateTo = React.useCallback(
    (path: string) => {
      if (!slug) return;
      void router.push(path);
    },
    [slug, router],
  );

  const handleDetail = React.useCallback(
    (item: OrderList) => {
      navigateTo(`/dashboard/${slug}/administrasi/order-list/detail/${item.id}`);
    },
    [navigateTo, slug],
  );

  const handleEdit = React.useCallback(
    (item: OrderList) => {
      navigateTo(`/dashboard/${slug}/administrasi/order-list/edit/${item.id}`);
    },
    [navigateTo, slug],
  );

  const handleDeleteClick = React.useCallback(
    (item: OrderList) => {
      setSelectedItem(item);
      setDeleteOpen(true);
    },
    [],
  );

  const showTableSkeleton = !listQuery.data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Order List"
          subtitle="Lihat dan kelola pesanan pelanggan dengan mudah"
        />

        <OrderListTable
          data={tableData}
          search={searchInput}
          page={page}
          perPage={perPage}
          totalData={listQuery.data?.meta.total ?? 0}
          isLoading={showTableSkeleton}
          isRefetching={listQuery.isFetching}
          onSearchChange={setSearchInput}
          onPageChange={setPage}
          onPerPageChange={(value) => {
            setPerPage(value);
          }}
          onAdd={handleAdd}
          onDetail={handleDetail}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onUpdateStatus={handleUpdateStatus}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </div>

      <OrderListDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        itemName={selectedItem?.code}
      />

      <OrderStatusConfirmDialog
        open={statusConfirmOpen}
        onOpenChange={setStatusConfirmOpen}
        onConfirm={handleConfirmUpdateStatus}
        isUpdating={updateMutation.isPending}
        itemName={statusUpdateData?.item.code}
        newStatus={statusUpdateData?.newStatus}
      />
    </DashboardLayout>
  );
}
