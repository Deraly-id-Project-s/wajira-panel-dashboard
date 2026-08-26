'use client';
// Force update

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../ui/alert-dialog';
import { useDeleteTransaction } from '@/hooks/useTransaction';
import { toast } from 'sonner';
import { Transaction } from '@/types/transaction.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  companyId: string;
}

export function DeleteTransactionDialog({ open, onOpenChange, transaction, companyId }: Props) {
  const mutation = useDeleteTransaction(companyId);
  const isLoading = mutation.isPending;

  const handleDelete = async () => {
    if (!transaction) return;
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
          <AlertDialogDescription>Apa anda yakin ingin menghapus data ini?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            {isLoading ? 'Menghapus...' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
