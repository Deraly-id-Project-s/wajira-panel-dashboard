import * as React from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { OrderListDetailView } from '@/components/features/order-list/OrderListDetailView';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useOrderListDetail, useUpdateOrderListState } from '@/hooks/useOrderList';
import { LoadingState } from '@/components/ui/loading-state';
import type { OrderListStatus } from '@/@types/order-list.types';
import { OrderStatusConfirmDialog } from '@/components/features/order-list/OrderStatusConfirmDialog';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

export default function OrderListDetailPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const id = router.isReady && typeof router.query.id === 'string' ? Number(router.query.id) : null;
  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('transaction:edit');
  const [nextStatus, setNextStatus] = React.useState<OrderListStatus | null>(null);

  const detailQuery = useOrderListDetail(id);
  const updateStateMutation = useUpdateOrderListState();

  // Handle error notifications
  React.useEffect(() => {
    if (detailQuery.isError) {
      const errorMsg =
        detailQuery.error instanceof Error
          ? detailQuery.error.message
          : 'Gagal memuat detail order list';
      toast.error(errorMsg);
    }
  }, [detailQuery.isError, detailQuery.error]);
  const effectiveData = detailQuery.data ?? null;

  const handleConfirmStatus = async () => {
    if (!id || !nextStatus) return;
    try {
      await updateStateMutation.mutateAsync({ id, payload: { status: nextStatus } });
      toast.success('Status order berhasil diperbarui');
      setNextStatus(null);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui status order');
    }
  };

  if (!router.isReady || detailQuery.isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (detailQuery.isError) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.push(`/dashboard/${slug}/administrasi/order-list`)}
              className="rounded-md p-1 transition-colors hover:bg-slate-100"
            >
              <ChevronLeft className="h-5 w-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-[24px] font-semibold text-slate-950">Detail Order List</h1>
            </div>
          </div>

          <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center">
            <p className="mb-4 text-red-700">
              {detailQuery.error instanceof Error
                ? detailQuery.error.message
                : 'Gagal memuat detail order list'}
            </p>
            <button
              onClick={() => detailQuery.refetch()}
              disabled={detailQuery.isFetching}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {detailQuery.isFetching ? 'Memuat ulang...' : 'Coba Lagi'}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!id || !effectiveData) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.push(`/dashboard/${slug}/administrasi/order-list`)}
              className="rounded-md p-1 transition-colors hover:bg-slate-100"
            >
              <ChevronLeft className="h-5 w-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-[24px] font-semibold text-slate-950">Detail Order List</h1>
            </div>
          </div>

          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-6 text-center">
            <p className="mb-4 text-yellow-700">Data order list tidak ditemukan.</p>
            <button
              onClick={() => router.push(`/dashboard/${slug}/administrasi/order-list`)}
              className="inline-flex items-center gap-2 rounded-md bg-yellow-600 px-4 py-2 text-white transition-colors hover:bg-yellow-700"
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
      <OrderListDetailView
        data={effectiveData}
        onBack={() => router.push(`/dashboard/${slug}/administrasi/order-list`)}
        canUpdateStatus={canEdit}
        isUpdatingStatus={updateStateMutation.isPending}
        onUpdateStatus={setNextStatus}
      />
      <OrderStatusConfirmDialog
        open={nextStatus !== null}
        onOpenChange={(open) => !open && setNextStatus(null)}
        onConfirm={handleConfirmStatus}
        isUpdating={updateStateMutation.isPending}
        itemName={effectiveData.code}
        newStatus={nextStatus ?? undefined}
      />
    </DashboardLayout>
  );
}
