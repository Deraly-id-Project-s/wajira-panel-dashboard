import * as React from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';
import type { DriverCashAdvanceBillingHistory } from '@/@types/driver-cash-advance.types';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
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
import { LoadingState } from '@/components/ui/loading-state';
import { formatKasBonDate } from './kas-bon.utils';

const cashAmount = (history: DriverCashAdvanceBillingHistory, code: string) =>
  history.cashes.find((cash) => cash.code === code)?.pivot.amount ?? 0;

interface KasBonPaymentHistoryTableProps {
  histories: DriverCashAdvanceBillingHistory[];
  onDelete?: (history: DriverCashAdvanceBillingHistory) => Promise<void> | void;
  isDeleting?: boolean;
  canDelete?: boolean;
}

export function KasBonPaymentHistoryTable({
  histories,
  onDelete,
  isDeleting = false,
  canDelete = true,
}: KasBonPaymentHistoryTableProps) {
  const [selectedHistory, setSelectedHistory] =
    React.useState<DriverCashAdvanceBillingHistory | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  const handleDeleteClick = (history: DriverCashAdvanceBillingHistory) => {
    setSelectedHistory(history);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedHistory || !onDelete) return;
    try {
      await onDelete(selectedHistory);
      setDeleteConfirmOpen(false);
      setSelectedHistory(null);
    } catch {
      // Handled by parent
    }
  };

  const columns = React.useMemo<ColumnDef<DriverCashAdvanceBillingHistory>[]>(
    () => [
      {
        header: 'Tanggal',
        cell: (item) => formatKasBonDate(item.paymentAt),
      },
      {
        header: 'BCA USD',
        alignment: 'right',
        cell: (item) => currenciesFormat('usd', cashAmount(item, 'bca_usd')),
      },
      {
        header: 'BCA IDR',
        alignment: 'right',
        cell: (item) => currenciesFormat('idr', cashAmount(item, 'bca_idr')),
      },
      {
        header: 'Cash IDR',
        alignment: 'right',
        cell: (item) => currenciesFormat('idr', cashAmount(item, 'cash_idr')),
      },
      {
        header: 'Bukti Bayar',
        alignment: 'center',
        cell: (item) =>
          item.paymentProof ? (
            <a
              href={item.paymentProof}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              <span>Lihat Bukti</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
      {
        header: 'Catatan',
        cell: (item) => item.note || '-',
      },
      ...(onDelete
        ? [
          {
            header: 'Aksi',
            alignment: 'center' as const,
            cell: (item: DriverCashAdvanceBillingHistory) => (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!canDelete || isDeleting}
                onClick={() => handleDeleteClick(item)}
                className="h-8 w-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer rounded-full"
                title="Hapus riwayat pembayaran"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ),
          },
        ]
        : []),
    ],
    [canDelete, isDeleting, onDelete],
  );

  return (
    <>
      <BaseTable data={histories} columns={columns} />

      <AlertDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
      >
        <AlertDialogContent className="rounded-md border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Riwayat Pembayaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus riwayat pembayaran tanggal{' '}
              <strong>
                {selectedHistory
                  ? formatKasBonDate(selectedHistory.paymentAt)
                  : ''}
              </strong>
              ? Data pembayaran yang dihapus akan memperbarui sisa tagihan kas bon. Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => setSelectedHistory(null)}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmDelete();
              }}
              disabled={isDeleting}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {isDeleting ? (
                <LoadingState
                  variant="inline"
                  text="Menghapus..."
                  iconClassName="text-white"
                />
              ) : (
                'Ya, Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
