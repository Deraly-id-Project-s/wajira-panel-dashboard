import * as React from 'react';
import { MoreVertical, Image as ImageIcon } from 'lucide-react';
import type { DriverCashAdvanceBillingHistory } from '@/@types/driver-cash-advance.types';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { ImagePreview } from '@/components/ui/image-preview';
import { getObjectStorageUrl } from '@/components/ui/storage-image';
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
  const [openActionId, setOpenActionId] =
    React.useState<string | number | null>(null);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);

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
        cell: (item) => {
          if (!item.paymentProof) return <span className="text-slate-400">-</span>;
          const fullUrl = getObjectStorageUrl(item.paymentProof);
          return (
            <button
              type="button"
              onClick={() => setPreviewImage(fullUrl)}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Lihat Bukti</span>
            </button>
          );
        },
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
              sticky: 'right' as const,
              cell: (item: DriverCashAdvanceBillingHistory) => (
                <DropdownMenu
                  open={openActionId === item.id}
                  onOpenChange={(open) => setOpenActionId(open ? item.id : null)}
                >
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                    <DropdownMenuItem
                      className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                      disabled={!canDelete || isDeleting}
                      onSelect={() => {
                        setOpenActionId(null);
                        handleDeleteClick(item);
                      }}
                    >
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
            },
          ]
        : []),
    ],
    [canDelete, isDeleting, onDelete, openActionId],
  );

  return (
    <>
      <BaseTable data={histories} columns={columns} />

      <ImagePreview
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        src={previewImage}
      />

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
