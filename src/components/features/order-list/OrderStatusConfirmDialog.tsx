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
import type { OrderListStatus } from '@/@types/order-list.types';
import { getOrderStatusLabel } from './order-list.utils';

interface OrderStatusConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isUpdating?: boolean;
  itemName?: string;
  newStatus?: OrderListStatus;
}

export function OrderStatusConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isUpdating = false,
  itemName,
  newStatus,
}: OrderStatusConfirmDialogProps) {
  const statusLabel = newStatus ? getOrderStatusLabel(newStatus) : '';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-md border-slate-200">
        <AlertDialogHeader>
          <AlertDialogTitle>Konfirmasi Ubah Status</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin mengubah status order <strong>{itemName || 'ini'}</strong> menjadi <strong>{statusLabel}</strong>?
          </AlertDialogDescription>
          <AlertDialogDescription className='bg-orange-100 p-2 rounded-md'>
            Proses ini akan menambah data <strong>DO Ekspedisi</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-md">Batal</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isUpdating} className="rounded-md bg-[#1f4163] hover:bg-[#183552]">
            {isUpdating ? 'Menyimpan...' : 'Ya, Ubah Status'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
