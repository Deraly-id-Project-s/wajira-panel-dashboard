import { useMemo, useState } from 'react';
import type { FinanceRefundRecord, RefundTransactionType } from '@/@types/finance-refund.types';
import FinanceRefundApprovalModal from '@/components/features/finance-refund/FinanceRefundApprovalModal';
import { RefundStatusBadge } from '@/components/features/refund/RefundStatusBadge';
import { Button } from '@/components/ui/button';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { useRouter } from 'next/router';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { TextTruncate } from '@/components/ui/text-truncate';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useDeleteFinanceRefund } from '@/hooks/useFinanceRefund';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DeleteFinanceRefundAction = ({ item, transactionType }: { item: FinanceRefundRecord, transactionType: RefundTransactionType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const deleteMutation = useDeleteFinanceRefund(transactionType);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="flex h-8 w-8 p-0 items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          sideOffset={10}
          collisionPadding={10}
          className="w-[280px] sm:w-[320px] max-w-[calc(100vw-2rem)] bg-white text-slate-800 p-3 sm:p-4 shadow-2xl border border-slate-200 z-[9999] pointer-events-auto break-words whitespace-normal"
          onPointerDownOutside={() => setIsOpen(false)}
          onMouseLeave={() => { }}
        >
          <div className="space-y-3">
            <p className="text-sm font-medium">Konfirmasi Hapus</p>
            <p className="text-[11px] sm:text-xs text-slate-500 whitespace-normal">Unit akan diperbarui stock status nya juga.</p>
            <div className="flex items-start space-x-2">
              <Checkbox
                id={`checkbox-${item.id}`}
                checked={isChecked}
                onCheckedChange={(c) => setIsChecked(c as boolean)}
                className="mt-0.5"
              />
              <label htmlFor={`checkbox-${item.id}`} className="text-[11px] sm:text-xs font-medium cursor-pointer leading-tight">
                Hapus Data Finance Refund {transactionType === 'sales' ? 'Jual' : 'Beli'}
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
                    await deleteMutation.mutateAsync({ refundId: item.id, deleteFinanceRefund: isChecked });
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

interface FinanceRefundTableProps {
  data: FinanceRefundRecord[];
  isLoading?: boolean;
  transactionType: RefundTransactionType;
  canEdit?: boolean;
  canDelete?: boolean;
}

const formatDate = (value: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID');
};

export default function FinanceRefundTable({ data, isLoading = false, transactionType, canEdit, canDelete }: FinanceRefundTableProps) {
  const [selectedRefund, setSelectedRefund] = useState<FinanceRefundRecord | null>(null);
  const router = useRouter();
  const { slug } = router.query;
  const slugStr = typeof slug === 'string' ? slug : '';

  const columns = useMemo<ColumnDef<FinanceRefundRecord>[]>(
    () => [
      {
        header: 'KODE REFUND',
        accessorKey: 'refundCode',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.refundCode} />,
      },
      {
        header: transactionType === 'sales' ? 'NO PENJUALAN' : 'NO PEMBELIAN',
        accessorKey: 'transactionCode',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <ReferenceLink href={`/dashboard/${slugStr}/transaksi/${transactionType === 'sales' ? 'penjualan-unit' : 'pembelian-unit'}/${item.transactionId}`}>
            {item.transactionCode}
          </ReferenceLink>
        )
      },
      {
        header: transactionType === 'sales' ? 'NAMA CUSTOMER' : 'NAMA SUPPLIER',
        accessorKey: 'partnerName',
        sortable: true,
        alignment: 'left',
        cell: (item) => <ReferenceLink href={`/dashboard/${slugStr}/master/${transactionType === 'sales' ? 'customer' : 'supplier'}?search=${item.partnerName}`}>{item.partnerName}</ReferenceLink>,
      },
      {
        header: 'TANGGAL',
        accessorKey: 'refundDate',
        sortable: true,
        alignment: 'center',
        cell: (item) => <span className="text-slate-800 font-normal">{formatDate(item.refundDate)}</span>,
      },
      {
        header: transactionType === 'sales' ? 'TOTAL PENJUALAN' : 'TOTAL PEMBELIAN',
        accessorKey: 'totalTransaction',
        sortable: true,
        alignment: 'center',
        cell: (item) => (
          <span className="text-slate-800 font-normal">
            {currenciesFormat('idr', item.totalTransaction ?? 0)}
          </span>
        ),
      },
      {
        header: 'TOTAL REFUND',
        accessorKey: 'refundAmount',
        sortable: true,
        alignment: 'center',
        cell: (item) => <span className="text-slate-800 font-normal">{currenciesFormat('idr', item.refundAmount)}</span>,
      },
      {
        header: transactionType === 'sales' ? 'KAS KELUAR' : 'KAS MASUK',
        accessorKey: 'cashName',
        sortable: true,
        alignment: 'left',
        cell: (item) => item.cashName ? (
          <ReferenceLink href={`/dashboard/${slugStr}/master/kas?search=${item.cashName}`}>
            {item.cashName}
          </ReferenceLink >
        ) : <span>-</span>
      },
      {
        header: 'KETERANGAN',
        accessorKey: 'note',
        sortable: true,
        alignment: 'left',
        cell: (item) => <TextTruncate maxLength={20} text={item.note || '-'} />,
      },
      {
        header: 'STATUS',
        accessorKey: 'status',
        sortable: true,
        alignment: 'center',
        cell: (item) => <RefundStatusBadge status={item.status} />,
      },
      {
        header: 'AKSI',
        alignment: 'center',
        sticky: 'right',
        className: 'w-[140px] min-w-[140px] max-w-[140px]',
        headerClassName: 'w-[140px] min-w-[140px] max-w-[140px]',
        cell: (item) => (
          <div className="flex flex-col items-center justify-center gap-2 py-1 min-w-[120px]">
            <Button
              size="sm"
              disabled={!canEdit}
              variant={item.status === 'approve' ? 'outline' : 'default'}
              className={cn(
                "h-8 text-xs font-semibold w-full font-sans transition-colors shadow-none whitespace-nowrap",
                item.status === 'approve'
                  ? "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRefund(item);
              }}
            >
              {item.status === 'approve' ? 'Sudah disetujui' : 'Setujui'}
            </Button>
            {canDelete && <DeleteFinanceRefundAction item={item} transactionType={transactionType} />}
          </div>
        ),
      }
    ],
    [transactionType, slugStr, canDelete, canEdit],
  );

  return (
    <>
      <BaseTable
        data={data}
        columns={columns}
        loading={isLoading}
        defaultSort={{ key: 'refundDate', direction: 'desc' }}
        onRowClick={(item) => setSelectedRefund(item)}
      />

      {selectedRefund ? (
        <FinanceRefundApprovalModal
          open={Boolean(selectedRefund)}
          onClose={() => setSelectedRefund(null)}
          refund={selectedRefund}
          transactionType={transactionType}
        />
      ) : null}
    </>
  );
}
