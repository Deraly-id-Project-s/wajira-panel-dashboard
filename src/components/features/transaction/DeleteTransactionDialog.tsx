'use client';
// Force update

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../ui/alert-dialog';
import { useDeleteTransaction } from '@/hooks/useTransaction';
import { toast } from 'sonner';
import { Transaction } from '@/@types/transaction.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  companyId: string;
}

export function DeleteTransactionDialog({ open, onOpenChange, transaction, companyId }: Props) {
  const mutation = useDeleteTransaction(companyId);
  const isLoading = mutation.isPending;
  const isLocked = Boolean(transaction?.is_lock || transaction?.isLock);

  const handleDelete = async () => {
    if (!transaction || isLocked) {
      if (isLocked) {
        toast.error('Data transaksi terkunci dan tidak dapat dihapus');
      }
      return;
    }
    try {
      await mutation.mutateAsync(transaction.id);
      toast.success('Transaksi berhasil dihapus');
      onOpenChange(false);
    } catch {
      toast.error('Gagal menghapus transaksi');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Data Ini?</AlertDialogTitle>
          <AlertDialogDescription>
            {isLocked
              ? 'Data transaksi ini terkunci dan tidak dapat dihapus.'
              : 'Apa anda yakin ingin menghapus data ini?'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {isLocked && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Data transaksi ini berstatus terkunci (is_lock: true) sehingga tindakan hapus dinonaktifkan.
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isLoading || isLocked}
            className="bg-destructive hover:bg-destructive/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Menghapus...' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
