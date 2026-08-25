import React from 'react';
import { AlertTriangle, CheckCircle2, Pencil, Play, Printer } from 'lucide-react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DOEkspedisiDetailCard } from '@/components/features/do-ekspedisi/DOEkspedisiDetailCard';
// import { DOEkspedisiDetailTable } from '@/components/features/do-ekspedisi/DOEkspedisiDetailTable';
import { DeleteDOEkspedisiModal } from '@/components/features/do-ekspedisi/DeleteDOEkspedisiModal';
import type { DoEkspedisi, DoEkspedisiItem, DoEkspedisiOrderList, DoEkspedisiOrderTarifItem, DoEkspedisiOrderTarifLoadItem } from '@/@types/do-ekspedisi.types';
import { useDeleteDoEkspedisiItem, useDoEkspedisiDetail, useUpdateDoEkspedisi } from '@/hooks/useDoEkspedisi';
import { useOrderListTarifs, useOrderListTarifItems } from '@/hooks/useOrderList';
import { useProcessDoExpedition } from '@/hooks/useDoInvoice';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/format';
import { DOEkspedisiRelatedData } from '@/components/features/do-ekspedisi/DOEkspedisiRelatedData';

// pagination helper removed (unused in print/detail view)

const getDoStatusBadgeClassName = (status: string) => {
  switch (String(status).toLowerCase()) {
    case 'draft':
      return 'border-slate-200 bg-slate-50 text-slate-700';
    case 'process':
      return 'border-blue-200 bg-blue-50 text-blue-700 font-semibold';
    case 'done':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold';
    case 'failed':
      return 'border-rose-200 bg-rose-50 text-rose-700 font-semibold';
    case 'pending':
      return 'border-amber-200 bg-amber-50 text-amber-700 font-semibold';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

const getDoStatusLabel = (status: string) => {
  switch (String(status).toLowerCase()) {
    case 'draft':
      return 'Draft';
    case 'process':
      return 'Proses';
    case 'done':
      return 'Selesai';
    case 'failed':
      return 'Gagal';
    case 'pending':
      return 'Tertunda';
    default:
      return status || '-';
  }
};

export default function DetailDOEkspedisiPage() {
  const router = useRouter();
  const { slug, id } = router.query;

  const [selectedItem, setSelectedItem] = React.useState<DoEkspedisiItem | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const detailQuery = useDoEkspedisiDetail(id ? String(id) : null);
  const processExpeditionMutation = useProcessDoExpedition();
  const updateMutation = useUpdateDoEkspedisi();
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

  const updateStatus = async (status: 'draft' | 'process' | 'done') => {
    if (!id || !detailQuery.data) return;

    const now = new Date().toISOString();
    try {
      await updateMutation.mutateAsync({
        id: String(id),
        payload: {
          date: detailQuery.data.date,
          vehicle_id: detailQuery.data.vehicleId ?? '',
          driver_id: detailQuery.data.driverId ?? '',
          driver_note: detailQuery.data.driverNote,
          status,
          start_date: status === 'draft' ? null : status === 'process' ? (detailQuery.data.startDate || now) : detailQuery.data.startDate,
          end_date: status === 'draft' ? null : status === 'done' ? now : detailQuery.data.endDate,
        },
      });
      toast.success(status === 'process' ? 'Pengiriman dimulai' : status === 'done' ? 'DO Ekspedisi telah selesai' : 'DO Ekspedisi dikembalikan ke Draft');
      await detailQuery.refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const backToList = React.useCallback(() => {
    if (slug) void router.push(`/dashboard/${slug}/do-ekspedisi`);
  }, [router, slug]);

  const pageHeader = (actions?: React.ReactNode) => (
    <PageHeader
      breadcrumbs={[
        { label: 'DO Ekspedisi', onClick: backToList },
        { label: 'Detail DO' },
      ]}
      title="Detail Delivery Order Ekspedisi"
      subtitle={(
        <div className="flex flex-wrap items-center gap-2">
          <span>Kode DO:</span>
          <span className="font-semibold text-orange-600">{detailQuery.data?.doCode}</span>
          {detailQuery.data && (
            <Badge variant="outline" className={cn('rounded-full px-3 py-1', getDoStatusBadgeClassName(detailQuery.data.status))}>
              {getDoStatusLabel(detailQuery.data.status)}
            </Badge>
          )}
          <span className="text-xs text-slate-500">Dibuat {detailQuery.data?.createdAt ? formatDate(detailQuery.data.createdAt) : ''}</span>
        </div>
      )}
      onBack={backToList}
      actions={actions}
    />
  );

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
          {pageHeader()}

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
          {pageHeader()}

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
        {pageHeader(
          <>
            {detailQuery.data?.status === 'draft' ? (
              <Button
                type="button"
                disabled={updateMutation.isPending || !detailQuery.data.driverId || !detailQuery.data.vehicleId}
                onClick={() => void updateStatus('process')}
                className="bg-orange-600 hover:bg-orange-700 text-white min-w-[120px] cursor-pointer font-medium"
              >
                <Play className="h-4 w-4" />
                {updateMutation.isPending ? 'Memproses...' : 'Mulai Pengiriman'}
              </Button>
            ) : detailQuery.data?.status === 'process' ? (
              <>
                <Button
                  type="button"
                  disabled={updateMutation.isPending}
                  onClick={() => {
                    if (window.confirm('Tandai pengiriman ini sebagai selesai? Claim driver baru dapat dikelola setelah langkah ini.')) void updateStatus('done');
                  }}
                  className="min-w-[150px] bg-emerald-600 font-medium text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {updateMutation.isPending ? 'Menyimpan...' : 'Selesaikan DO'}
                </Button>
                <Button type="button" variant="outline" disabled={updateMutation.isPending} onClick={() => void updateStatus('draft')} className="min-w-[120px] border-slate-300 font-medium text-slate-700 hover:bg-slate-50">
                  Kembali ke Draft
                </Button>
              </>
            ) : null}

            {detailQuery.data?.status === 'draft' && (
              <Button
                variant="outline"
                onClick={() => slug && id && void router.push(`/dashboard/${slug}/do-ekspedisi/${id}/edit`)}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
            <Button
              onClick={async () => {
                if (!id || !slug) return;
                try {
                  await processExpeditionMutation.mutateAsync({ id: Number(id) });
                  router.push(`/dashboard/${slug}/do-ekspedisi/print/${id}`);
                } catch (error: any) {
                  toast.error(getApiErrorMessage(error));
                }
              }}
              disabled={processExpeditionMutation.isPending || detailQuery.data.status === 'draft' || !detailQuery.data.driverId || !detailQuery.data.vehicleId}
              className="button-theme-1!"
            >
              <Printer className="h-4 w-4" />
              {processExpeditionMutation.isPending ? 'Menyiapkan...' : 'Print DO'}
            </Button>
          </>,
        )}

        {(!effectiveData?.driver || !effectiveData?.vehicle) && (
          <div role="alert" className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">Driver atau kendaraan belum dipilih</p>
              <p className="mt-1 text-sm text-amber-800">Silakan klik Edit untuk melengkapi driver dan kendaraan sebelum memulai pengiriman.</p>
            </div>
          </div>
        )}

        <DOEkspedisiDetailCard data={effectiveData ?? detailQuery.data} />
        <DOEkspedisiRelatedData data={effectiveData ?? detailQuery.data} onRefresh={() => void detailQuery.refetch()} />

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

          <Button onClick={() => slug && id && router.push(`/dashboard/${slug}/do-ekspedisi/detail/${id}/create`)} className="button-theme-1!">
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
