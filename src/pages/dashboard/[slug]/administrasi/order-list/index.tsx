import * as React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import type { OrderList, OrderListStatus } from '@/@types/order-list.types';
import { OrderListDeleteDialog } from '@/components/features/order-list/OrderListDeleteDialog';
import { OrderListTable } from '@/components/features/order-list/OrderListTable';
import { OrderStatusConfirmDialog } from '@/components/features/order-list/OrderStatusConfirmDialog';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useOrderLists, useDeleteOrderList, useOrderListTarifs, useOrderListTarifItems, useUpdateOrderList } from '@/hooks/useOrderList';
import { composeOrderListWithTarifs } from '@/services/order-list.service';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { PageHeader } from '@/components/ui/page-header';

export default function OrderListPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('transaction:create');
  const canEdit = hasPermission('transaction:edit');
  const canDelete = hasPermission('transaction:delete');

  const initialPage = typeof router.query.page === 'string' ? Number(router.query.page) : 1;
  const initialPerPage = 25;
  const initialSearch = typeof router.query.search === 'string' ? router.query.search : '';
  const [page, setPage] = React.useState(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1);
  const [perPage, setPerPage] = React.useState(Number.isFinite(initialPerPage) && initialPerPage > 0 ? initialPerPage : 25);
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
    }),
    [page, perPage, search],
  );

  const tarifItemQueryParams = React.useMemo(
    () => ({
      page: 1,
      perPage: 50,
      order_by: 'created_at' as const,
      order_sort: 'desc' as const,
    }),
    [],
  );

  const tarifLoadItemQueryParams = React.useMemo(
    () => ({
      page: 1,
      perPage: 100,
      order_by: 'created_at' as const,
      order_sort: 'desc' as const,
    }),
    [],
  );

  const listQuery = useOrderLists(listQueryParams);
  const tarifItemQuery = useOrderListTarifs(tarifItemQueryParams);
  const tarifLoadItemQuery = useOrderListTarifItems(tarifLoadItemQueryParams);
  const deleteMutation = useDeleteOrderList();
  const updateMutation = useUpdateOrderList();

  const tableData = React.useMemo(() => {
    const orders = listQuery.data?.data ?? [];
    const tarifHeaders = tarifItemQuery.data?.data ?? [];
    const tarifLoadItems = tarifLoadItemQuery.data?.data ?? [];

    if (!orders.length) {
      return orders;
    }

    const tarifMap = new Map<number, typeof tarifHeaders>();
    const tarifItemMap = new Map<number, typeof tarifLoadItems>();

    tarifHeaders.forEach((item) => {
      const current = tarifMap.get(item.doOrderListId) ?? [];
      current.push(item);
      tarifMap.set(item.doOrderListId, current);
    });

    tarifLoadItems.forEach((item) => {
      const orderId = Number(item.doOrderListId ?? 0);
      if (!orderId) return;
      const current = tarifItemMap.get(orderId) ?? [];
      current.push(item);
      tarifItemMap.set(orderId, current);
    });

    return orders.map((order) => {
      const orderTarifs = tarifMap.get(order.id) ?? [];
      const orderTarifItems = tarifItemMap.get(order.id) ?? [];

      return composeOrderListWithTarifs(order, orderTarifs.length ? orderTarifs : order.tarifs, orderTarifItems);
    });
  }, [listQuery.data?.data, tarifItemQuery.data?.data, tarifLoadItemQuery.data?.data]);

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
        payload: {
          customer_id: item.customerId,
          status: newStatus,
          invoice_bill: item.billInvoice,
          bill_invoice: item.billInvoice,
          vehicle_type: item.vehicleType || 'fuso',
          note: item.note,
          ppn: item.ppn,
          uj_driver: item.ujDriver,
          loading_in: item.loadingIn,
          loading_out: item.loadingOut,
        }
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

  const showTableSkeleton = !listQuery.data && !tarifItemQuery.data && !tarifLoadItemQuery.data;

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
          isRefetching={listQuery.isFetching || tarifItemQuery.isFetching || tarifLoadItemQuery.isFetching}
          onSearchChange={setSearchInput}
          onPageChange={setPage}
          onPerPageChange={(value) => {
            setPerPage(value);
            setPage(1);
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
