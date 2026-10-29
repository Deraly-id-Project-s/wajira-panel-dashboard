import { useState, useMemo } from 'react';
import { Trash2, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { formatDate } from '@/lib/utils/format';
import { TextTruncate } from '@/components/ui/text-truncate';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  getHistoryBcaIdrAmount,
  getHistoryCashIdrAmount,
  getHistoryUsdAmount,
  getHistoryTotalIdrEquivalent,
} from '@/utils/payment-helpers';
import type { UnitBillingHistory } from '@/@types/unit-billing.types';

export interface BillingHistoryTableProps {
  isUsd: boolean;
  isPaid: boolean;
  histories: UnitBillingHistory[];
  loading?: boolean;
  onDeleteHistory?: (id: string | number) => Promise<void>;
}

export function BillingHistoryTable({
  isUsd,
  isPaid,
  histories,
  loading = false,
  onDeleteHistory,
}: BillingHistoryTableProps) {
  const [deleteTargetId, setDeleteTargetId] = useState<string | number | null>(null);

  const columns = useMemo<ColumnDef<UnitBillingHistory>[]>(() => {
    const cols: ColumnDef<UnitBillingHistory>[] = [
      {
        header: 'Tanggal',
        accessorKey: 'payment_at',
        sortable: true,
        className: 'w-[120px]',
        cell: (item) => (item.payment_at ? formatDate(item.payment_at) : '-'),
      },
    ];

    if (isUsd) {
      cols.push({
        header: 'Nominal USD',
        alignment: 'right',
        cell: (item) => (
          <span className="font-semibold text-slate-800">
            {currenciesFormat('usd', getHistoryUsdAmount(item))}
          </span>
        ),
      });
    } else {
      cols.push(
        {
          header: 'BCA IDR',
          alignment: 'right',
          cell: (item) => currenciesFormat('idr', getHistoryBcaIdrAmount(item)),
        },
        {
          header: 'Cash IDR',
          alignment: 'right',
          cell: (item) => currenciesFormat('idr', getHistoryCashIdrAmount(item)),
        },
      );
    }

    cols.push(
      {
        header: 'Metode',
        cell: (item) => {
          if (Array.isArray(item.payment_methods) && item.payment_methods.length > 0) {
            return item.payment_methods.join(', ');
          }
          const methods: string[] = [];
          if (getHistoryUsdAmount(item) > 0) methods.push('BCA USD');
          if (getHistoryBcaIdrAmount(item) > 0) methods.push('BCA IDR');
          if (getHistoryCashIdrAmount(item) > 0) methods.push('Cash');
          return methods.length > 0 ? methods.join(', ') : '-';
        },
      },
      {
        header: 'Bukti Bayar',
        alignment: 'center',
        className: 'w-[110px]',
        cell: (item) =>
          item.payment_proof ? (
            <a
              href={item.payment_proof}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Lihat</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-slate-400 text-xs">-</span>
          ),
      },
      {
        header: 'Keterangan',
        cell: (item) => <TextTruncate text={item.note || '-'} maxLength={35} />,
      },
    );

    if (onDeleteHistory) {
      cols.push({
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        className: 'w-[60px]',
        cell: (item) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTargetId(item.id)}
            disabled={loading || isPaid}
            type="button"
            className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
            aria-label="Hapus riwayat pembayaran"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      });
    }

    return cols;
  }, [isUsd, isPaid, loading, onDeleteHistory]);

  return (
    <>
      <CollapsibleBox
        title="Riwayat Pembayaran"
        description="Daftar arus transaksi dan riwayat pembayaran tagihan"
        defaultExpanded={true}
      >
        <BaseTable
          data={histories ?? []}
          columns={columns}
          containerClassName="border-0 shadow-none rounded-none"
          headerRowClassName="bg-slate-50 hover:bg-slate-50 border-b"
        />
      </CollapsibleBox>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent className="rounded-md border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Histori Pembayaran</AlertDialogTitle>
            <AlertDialogDescription>
              Record riwayat pembayaran dan arus transaksi yang bersangkutan akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTargetId && onDeleteHistory) {
                  onDeleteHistory(deleteTargetId);
                  setDeleteTargetId(null);
                }
              }}
              disabled={isPaid}
              className="rounded-md bg-rose-600 hover:bg-rose-700 text-white"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
