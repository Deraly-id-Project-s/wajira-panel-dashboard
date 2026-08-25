'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { useRefundList } from '@/hooks/useRefundAdministrasi';
import { UnitTransactionRefund } from '@/@types/refund.type';
import { RefundStatusBadge } from '@/components/features/refund/RefundStatusBadge';
import { Button } from '@/components/ui/button';
import { Eye, Trash2, MoreVertical } from 'lucide-react';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { CopyBox } from '@/components/ui/copy-box';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { useDeleteRefund } from '@/hooks/useRefundAdministrasi';
import { toast } from 'sonner';

const DeleteFinanceRefundAction = ({ item, transactionType }: { item: UnitTransactionRefund, transactionType: 'sales' | 'purchase' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const deleteMutation = useDeleteRefund();

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={isOpen} onOpenChange={(open) => {
        if (open) setIsOpen(true);
      }}>
        <TooltipTrigger asChild>
          <div className="w-full">
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                setIsOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Hapus
            </DropdownMenuItem>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          align="center" 
          sideOffset={10}
          collisionPadding={10}
          className="w-[280px] sm:w-[320px] max-w-[calc(100vw-2rem)] bg-white text-slate-800 p-3 sm:p-4 shadow-2xl border border-slate-200 z-[9999] pointer-events-auto break-words whitespace-normal" 
          onPointerDownOutside={() => setIsOpen(false)}
          onMouseLeave={() => {}}
        >
          <div className="space-y-3">
            <p className="text-sm font-medium">Konfirmasi Hapus</p>
            <p className="text-[11px] sm:text-xs text-slate-500">Unit akan diperbarui stock status nya juga.</p>
            <div className="flex items-start space-x-2">
              <Checkbox
                id={`checkbox-${item.id}`}
                checked={isChecked}
                onCheckedChange={(c) => setIsChecked(c as boolean)}
                className="mt-0.5"
              />
              <label htmlFor={`checkbox-${item.id}`} className="text-[11px] sm:text-xs font-medium cursor-pointer leading-tight">
                Hapus Data Finance Refund Jual
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setIsOpen(false)} className="h-7 text-[11px] sm:text-xs px-2 sm:px-3">Batal</Button>
              <Button
                size="sm"
                className="h-7 text-[11px] sm:text-xs bg-red-600 hover:bg-red-700 px-2 sm:px-3 text-white"
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
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID');
};

export default function TransaksiRefundJualPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const unitTransactionId = typeof router.query.unit_transaction_id === 'string' ? router.query.unit_transaction_id : undefined;

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState('');

  const refundQuery = useRefundList({
    page,
    perPage,
    search: search || undefined,
    unit_transaction_id: unitTransactionId,
  });

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
        cell: (item) => item.total_qty ?? item.items?.length ?? 0,
      },
      {
        header: 'STATUS',
        accessorKey: 'status',
        sortable: true,
        alignment: 'left',
        cell: (item) => <RefundStatusBadge status={item.status === 'approve' || item.status === 'reject' ? item.status : 'waiting'} />,
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
              <DropdownMenuItem
                onClick={() => {
                  const trxId = item.unit_transaction_id || item.transaction?.id;
                  if (trxId) {
                    router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${trxId}/refund/${item.id}`);
                  }
                }}
              >
                <Eye className="mr-2 h-4 w-4" /> Detail
              </DropdownMenuItem>
              <DeleteFinanceRefundAction item={item} transactionType="sales" />
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router, slug],
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Refund Penjualan"
          description="Daftar transaksi refund penjualan unit"
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
          onPageChange={setPage}
        />
      </div>
    </DashboardLayout>
  );
}
