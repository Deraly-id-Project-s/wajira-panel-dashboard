import React from 'react';
import { ChevronLeft, Printer } from 'lucide-react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DOEkspedisiDetailCard } from '@/components/features/do-ekspedisi/DOEkspedisiDetailCard';
// import { DOEkspedisiDetailTable } from '@/components/features/do-ekspedisi/DOEkspedisiDetailTable';
import { DeleteDOEkspedisiModal } from '@/components/features/do-ekspedisi/DeleteDOEkspedisiModal';
import type { DoEkspedisi, DoEkspedisiItem, DoEkspedisiOrderList, DoEkspedisiOrderTarifItem, DoEkspedisiOrderTarifLoadItem } from '@/@types/do-ekspedisi.types';
import { useDeleteDoEkspedisiItem, useDoEkspedisiDetail } from '@/hooks/useDoEkspedisi';
import { useOrderListTarifs, useOrderListTarifItems } from '@/hooks/useOrderList';
import { useProcessDoExpedition } from '@/hooks/useDoInvoice';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { LoadingState } from '@/components/ui/loading-state';

// pagination helper removed (unused in print/detail view)

export default function DetailDOEkspedisiPage() {
  const router = useRouter();
  const { slug, id } = router.query;

  const [selectedItem, setSelectedItem] = React.useState<DoEkspedisiItem | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const detailQuery = useDoEkspedisiDetail(id ? String(id) : null);
  const processExpeditionMutation = useProcessDoExpedition();
  const orderListId = detailQuery.data?.orderList?.id ?? null;
  const tarifQuery = useOrderListTarifs({
    page: 1,
    perPage: 100,
    do_orderlist_id: orderListId ?? undefined,
    order_by: 'created_at',
    order_sort: 'desc',
    enabled: Boolean(orderListId),
  });
  const tarifItemQuery = useOrderListTarifItems({
    page: 1,
    perPage: 500,
    do_orderlist_id: orderListId ?? undefined,
    order_by: 'created_at',
    order_sort: 'desc',
    enabled: Boolean(orderListId),
  });
  const deleteItemMutation = useDeleteDoEkspedisiItem();

  const effectiveData = React.useMemo<DoEkspedisi | null>(() => {
    if (!detailQuery.data) return null;

    const tarifHeaders = tarifQuery.data?.data ?? [];
    const tarifItems = tarifItemQuery.data?.data ?? [];
    const mergedOrderList: DoEkspedisiOrderList | null = detailQuery.data.orderList
      ? {
        ...detailQuery.data.orderList,
        tarifs: (tarifHeaders.length ? tarifHeaders : detailQuery.data.orderList.tarifs ?? []).map((tarif) => {
          const matchedItems = tarifItems.filter((item) => {
            const left = Number(item.doOrderListTarifId ?? 0);
            const rightA = Number(tarif.id ?? 0);
            const rightB = Number((tarif as any).tarifId ?? 0);
            return left === rightA || (rightB && left === rightB);
          });
          const mappedTarifItems: DoEkspedisiOrderTarifLoadItem[] = matchedItems.map((item) => ({
            id: Number(item.id ?? 0),
            uuid: item.uuid,
            loadContent: item.loadContent,
            qty: Number(item.qty ?? 0),
          }));

          return {
            ...tarif,
            loadContent: tarif.loadContent || mappedTarifItems[0]?.loadContent || '-',
            qty: tarif.qty || mappedTarifItems[0]?.qty || 0,
            tarifItems: mappedTarifItems.length ? mappedTarifItems : tarif.tarifItems,
          } satisfies DoEkspedisiOrderTarifItem;
        }),
      }
      : null;

    return {
      ...detailQuery.data,
      orderList: mergedOrderList,
    };
  }, [detailQuery.data, tarifQuery.data?.data, tarifItemQuery.data?.data]);

  // Print effect removed (handled in dedicated print page)

  const handleDeleteItem = async () => {
    if (!selectedItem || !id) return;

    try {
      await deleteItemMutation.mutateAsync({
        id: selectedItem.id,
        doExpeditionId: String(id),
      });
      toast.success('Item DO berhasil dihapus');
      setDeleteOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus item DO');
    }
  };

  // Handle errors from detailQuery
  React.useEffect(() => {
    if (detailQuery.isError) {
      const errorMsg =
        detailQuery.error instanceof Error
          ? detailQuery.error.message
          : 'Gagal memuat detail DO Ekspedisi';
      toast.error(errorMsg);
    }
  }, [detailQuery.isError, detailQuery.error]);

  if (detailQuery.isLoading || tarifQuery.isLoading || tarifItemQuery.isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  // Check if router is ready and id is available
  if (!router.isReady || !id) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center text-yellow-600">ID DO tidak ditemukan</div>
      </DashboardLayout>
    );
  }

  if (detailQuery.isError) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => slug && router.push(`/dashboard/${slug}/do-ekspedisi`)}
              className="rounded-md p-1 transition-colors hover:bg-slate-100"
            >
              <ChevronLeft className="h-5 w-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">Detail Delivery Order Ekspedisi</h1>
            </div>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="mb-4 text-red-700">
              {detailQuery.error instanceof Error
                ? detailQuery.error.message
                : 'Gagal memuat detail DO Ekspedisi'}
            </p>
            <button
              onClick={() => detailQuery.refetch()}
              disabled={detailQuery.isFetching}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {detailQuery.isFetching ? 'Memuat ulang...' : 'Coba Lagi'}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!detailQuery.data) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => slug && router.push(`/dashboard/${slug}/do-ekspedisi`)}
              className="rounded-md p-1 transition-colors hover:bg-slate-100"
            >
              <ChevronLeft className="h-5 w-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">Detail Delivery Order Ekspedisi</h1>
            </div>
          </div>

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
            <p className="mb-4 text-yellow-700">Data DO Ekspedisi tidak ditemukan</p>
            <button
              onClick={() => slug && router.push(`/dashboard/${slug}/do-ekspedisi`)}
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-white transition-colors hover:bg-yellow-700"
            >
              Kembali ke Daftar
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <button onClick={() => slug && router.push(`/dashboard/${slug}/do-ekspedisi`)} className="rounded-md p-1 transition-colors hover:bg-slate-100">
              <ChevronLeft className="h-5 w-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">Detail Delivery Order Ekspedisi</h1>
            </div>
          </div>
          <button
            onClick={async () => {
              if (!id || !slug) return;
              try {
                await processExpeditionMutation.mutateAsync({ id: Number(id) });
                router.push(`/dashboard/${slug}/do-ekspedisi/print/${id}`);
              } catch (error: any) {
                toast.error(getApiErrorMessage(error));
              }
            }}
            className="inline-flex items-center gap-2 rounded-md bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#152e4d]"
          >
            <Printer className="h-4 w-4" />
            Print DO
          </button>
        </div>

        <DOEkspedisiDetailCard data={effectiveData ?? detailQuery.data} />

        {/* <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
            <div className="relative w-full sm:w-[320px]">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search here"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="h-12 rounded-md border-[#E5E7EB] bg-white pl-11"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-slate-600">Show</span>
              <Select value={String(perPage)} onValueChange={(value) => {
                setPerPage(Number(value));
                setPage(1);
              }}>
                <SelectTrigger className="h-12 w-[88px] rounded-md border-[#E5E7EB] bg-white">
                  <SelectValue placeholder="25" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-slate-600">Page</span>
            </div>
          </div>

          <Button onClick={() => slug && id && router.push(`/dashboard/${slug}/do-ekspedisi/detail/${id}/create`)} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Data
          </Button>
        </div> */}

        {/* <DOEkspedisiDetailTable
          data={tableData}
          page={page}
          perPage={perPage}
          isLoading={itemQuery.isLoading}
          onView={(item) => slug && id && router.push(`/dashboard/${slug}/do-ekspedisi/detail/${id}/item/${item.id}`)}
          onEdit={(item) => slug && id && router.push(`/dashboard/${slug}/do-ekspedisi/detail/${id}/item/${item.id}/edit`)}
          onDelete={(item) => {
            setSelectedItem(item);
            setDeleteOpen(true);
          }}
        /> */}

        {/* <div className="flex flex-col gap-4 px-1 pt-1 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-slate-500">
            Showing {startData}-{endData} of {totalData} data
          </div>

          {totalPages > 1 ? (
            <div className="flex flex-wrap items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1} className="text-slate-600">
                Previous
              </Button>
              {renderPagination(page, totalPages).map((item, index) => (
                <Button
                  key={`${item}-${index}`}
                  variant={item === page ? 'outline' : 'ghost'}
                  size="sm"
                  disabled={item === '...'}
                  onClick={() => typeof item === 'number' && setPage(item)}
                  className={item === page ? 'border-[#D7DEE7] bg-white' : 'text-slate-600'}
                >
                  {item}
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages} className="text-slate-600">
                Next
              </Button>
            </div>
          ) : null}
        </div> */}
      </div>

      <DeleteDOEkspedisiModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteItem}
        isDeleting={deleteItemMutation.isPending}
        itemName={selectedItem?.customerName}
      />
    </DashboardLayout>
  );
}
