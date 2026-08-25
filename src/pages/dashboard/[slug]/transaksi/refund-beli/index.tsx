'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { useRefundList } from '@/hooks/useRefundAdministrasi';
import { UnitTransactionRefund } from '@/@types/refund.type';
import { RefundStatusBadge } from '@/components/features/refund/RefundStatusBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight, Eye, MoreVertical, Pencil, Plus } from 'lucide-react';
import { ReferenceLink } from '@/components/ui/reference-link';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { CopyBox } from '@/components/ui/copy-box';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usePurchaseById, usePurchaseUnitItemDetails } from '@/hooks/usePurchase';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useDeleteRefund } from '@/hooks/useRefundAdministrasi';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils/format';

const DeleteFinanceRefundAction = ({ item, transactionType }: { item: UnitTransactionRefund, transactionType: 'sales' | 'purchase' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const deleteMutation = useDeleteRefund();

  return (
    <>
      <DropdownMenuItem
        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
        onSelect={(e) => {
          e.preventDefault();
          setIsOpen(true);
        }}
      >
        <Trash2 className="mr-2 h-4 w-4" /> Hapus
      </DropdownMenuItem>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Unit akan diperbarui stock status nya juga.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start space-x-2 py-4">
            <Checkbox
              id={`checkbox-${item.id}`}
              checked={isChecked}
              onCheckedChange={(c) => setIsChecked(c as boolean)}
              className="mt-0.5"
            />
            <label htmlFor={`checkbox-${item.id}`} className="text-sm font-medium cursor-pointer leading-tight">
              Hapus Data Finance Refund Beli
            </label>
          </div>
          <DialogFooter className="mt-4 sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={deleteMutation.isPending}>
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await deleteMutation.mutateAsync({ id: item.id, deleteFinanceRefund: isChecked });
                  toast.success('Data berhasil dihapus');
                  setIsOpen(false);
                } catch (err: any) {
                  toast.error(err.message || 'Gagal menghapus data');
                }
              }}
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function TransaksiRefundBeliPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const unitTransactionId = typeof router.query.unit_transaction_id === 'string' ? router.query.unit_transaction_id : undefined;

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState('');

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('transaction:create');
  const canEdit = hasPermission('transaction:edit');

  const refundQuery = useRefundList({
    page,
    perPage,
    search: search || undefined,
    unit_transaction_id: unitTransactionId,
  });

  const { data: purchase } = usePurchaseById(unitTransactionId || '');
  const { data: purcahseItemDetails } = usePurchaseUnitItemDetails(purchase?.id || '');

  const handleDetail = useCallback((trxId: string, rfdId: string) => {
    router.push(`/dashboard/${slug}/transaksi/pembelian-unit/${trxId}/refund/${rfdId}`);
  }, [router, slug]);

  const handleEdit = useCallback((trxId: string, rfdId: string) => {
    router.push(`/dashboard/${slug}/transaksi/refund-beli/${rfdId}/edit?unit_transaction_id=${trxId}`);
  }, [router, slug]);

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
          const remaining = item.remaining_payment ?? Math.max(0, item.refund_amount - totalPaid);
          return <span className="font-medium text-amber-700">{currenciesFormat('idr', remaining)}</span>;
        },
      },
      {
        header: 'QTY',
        accessorKey: 'total_qty',
        sortable: true,
        alignment: 'left',
        cell: (item) => item.total_qty + ' Unit',
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
            <DropdownMenuContent align="end" className="z-50">
              <DropdownMenuItem onClick={() => handleEdit(item.unit_transaction_id || item.transaction?.id || '', item.id)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDetail(item.unit_transaction_id || item.transaction?.id || '', item.id)}>
                <Eye className="mr-2 h-4 w-4" /> Detail / Kelola Unit
              </DropdownMenuItem>
              <DeleteFinanceRefundAction item={item} transactionType="purchase" />
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [handleDetail, handleEdit],
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Pembelian Unit', onClick: () => router.push(`/dashboard/${slug}/transaksi/pembelian-unit`) },
            { label: 'Data Refund Pembelian' }
          ]}
          title="Data Refund Pembelian"
          subtitle={
            <>
              <span>Kode Beli:</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">{purchase?.code}</span>
            </>
          }
          onBack={() => router.push(`/dashboard/${slug}/transaksi/pembelian-unit`)}
        />

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
          headerActions=
          {(
            <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                {canCreate && (
                  <Button
                    onClick={() => router.push(`/dashboard/${slug}/transaksi/refund-beli/create?unit_transaction_id=${unitTransactionId || ''}`)}
                    className="button-theme-1!"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Data Data Refund Pembelian
                  </Button>
                )}
              </div>
            </div>
          )}
          onPageChange={setPage}
        />
      </div>
    </DashboardLayout>
  );
}
