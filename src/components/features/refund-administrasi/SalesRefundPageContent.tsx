import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, ChevronRight, Eye, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import type { UnitTransactionRefund } from '@/@types/refund.type';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDeleteRefund, useRefundList, useRefundTransactionDetail } from '@/hooks/useRefundAdministrasi';
import { toast } from 'sonner';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { CopyBox } from '@/components/ui/copy-box';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID');
};

export default function SalesRefundPageContent({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const [deletingRefund, setDeletingRefund] = useState<UnitTransactionRefund | null>(null);
  const deleteMutation = useDeleteRefund();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState('');

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('transaction:create');
  const canEdit = hasPermission('transaction:edit');

  const transactionQuery = useRefundTransactionDetail(transactionId);
  const refundQuery = useRefundList({
    page,
    perPage,
    search: search || undefined,
    unit_transaction_id: transactionId,
  });

  const handleDelete = async () => {
    if (!deletingRefund) return;

    try {
      await deleteMutation.mutateAsync(deletingRefund.id);
      toast.success('Data refund penjualan berhasil dihapus');
      setDeletingRefund(null);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menghapus data refund penjualan');
    }
  };

  const handleEditRedirect = useCallback((refund: UnitTransactionRefund) => {
    const hasPayments = (refund.total_paid ?? (refund.payments ?? []).reduce((total, item) => total + Number(item.amount), 0)) > 0;
    if (hasPayments) {
      toast.warning('Refund yang sudah memiliki pembayaran sebaiknya tidak diubah. Hapus atau sesuaikan pembayaran refund terlebih dahulu.');
      return;
    }

    router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${transactionId}/refund/${refund.id}/edit`);
  }, [router, slug, transactionId]);

  const handleDeletePrompt = useCallback((refund: UnitTransactionRefund) => {
    const hasPayments = (refund.total_paid ?? (refund.payments ?? []).reduce((total, item) => total + Number(item.amount), 0)) > 0;
    if (hasPayments) {
      toast.warning('Refund yang sudah memiliki pembayaran tidak dapat dihapus langsung. Hapus pembayaran refund terlebih dahulu.');
      return;
    }

    setDeletingRefund(refund);
  }, []);

  const columns = useMemo<ColumnDef<UnitTransactionRefund>[]>(
    () => [
      {
        header: 'KODE REFUND',
        accessorKey: 'code',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.code} />,
      },
      {
        header: 'TANGGAL REFUND',
        accessorKey: 'refund_date',
        sortable: true,
        alignment: 'left',
        cell: (item) => formatDate(item.refund_date),
      },
      {
        header: 'NOMINAL REFUND',
        accessorKey: 'refund_amount',
        sortable: true,
        alignment: 'left',
        cell: (item) => currenciesFormat('idr', item.refund_amount),
      },
      {
        header: 'TOTAL DIBAYAR',
        alignment: 'left',
        cell: (item) => {
          const totalPaid = item.total_paid ?? (item.payments ?? []).reduce((acc, p) => acc + Number(p.amount), 0);
          return currenciesFormat('idr', totalPaid);
        },
      },
      {
        header: 'SISA BAYAR',
        alignment: 'left',
        cell: (item) => {
          const totalPaid = item.total_paid ?? (item.payments ?? []).reduce((acc, p) => acc + Number(p.amount), 0);
          const remaining = item.remaining_payment ?? Math.max(0, Number(item.refund_amount || 0) - totalPaid);
          return <span className="font-medium text-amber-700">{currenciesFormat('idr', remaining)}</span>;
        },
      },
      {
        header: 'QTY',
        accessorKey: 'total_qty',
        sortable: true,
        alignment: 'left',
        cell: (item) => (item.total_qty ?? item.items?.length ?? 0) + ' Unit',
      },
      {
        header: 'aksi',
        alignment: 'left',
        sticky: 'right',
        cell: (item) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={() => handleEditRedirect(item)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${transactionId}/refund/${item.id}`)}>
                <Eye className="mr-2 h-4 w-4" /> Detail / Kelola Unit
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem className="text-[#EF4444] focus:text-[#EF4444]" onClick={() => handleDeletePrompt(item)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Hapus
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router, slug, transactionId, canEdit, handleEditRedirect, handleDeletePrompt],
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* BREADCRUMB HEADER */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="hover:text-slate-800 cursor-pointer" onClick={() => router.push(`/dashboard/${slug}/transaksi/penjualan-unit`)}>
            Penjualan Unit
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="font-medium text-slate-800">Data Refund Penjualan</span>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${transactionId}`)} variant="ghost" size="icon" className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-slate-900">Data Refund Penjualan</h1>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>Kode Jual:</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">{transactionQuery.data?.code}</span>
              </div>
            </div>
          </div>
        </div>

        <BaseTable
          data={refundQuery.data?.data ?? []}
          columns={columns}
          loading={refundQuery.isLoading}
          searchPlaceholder="Cari kode refund..."
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          showLimitChange
          perPage={perPage}
          onPerPageChange={(limit) => {
            setPerPage(limit);
            setPage(1);
          }}
          meta={
            refundQuery.data?.meta
              ? {
                currentPage: refundQuery.data.meta.currentPage,
                perPage: refundQuery.data.meta.perPage,
                lastPage: refundQuery.data.meta.lastPage,
                total: refundQuery.data.meta.total,
              }
              : undefined
          }
          headerActions={
            <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                {canCreate && (
                  <Button
                    onClick={() => router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${transactionId}/refund/create`)}
                    className="button-theme-1!"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Data Data Refund Penjualan
                  </Button>
                )}
              </div>
            </div>
          }
          onPageChange={setPage}
        />



        <AlertDialog open={Boolean(deletingRefund)} onOpenChange={(open) => !open && setDeletingRefund(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Refund Penjualan</AlertDialogTitle>
              <AlertDialogDescription>Data refund yang dihapus tidak bisa dikembalikan. Lanjutkan penghapusan?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
