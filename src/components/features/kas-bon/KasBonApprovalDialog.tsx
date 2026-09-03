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

interface KasBonApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isApproving?: boolean;
  itemName?: string;
}

export function KasBonApprovalDialog({
  open,
  onOpenChange,
  onConfirm,
  isApproving = false,
  itemName,
}: KasBonApprovalDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-md border-slate-200">
        <AlertDialogHeader>
          <AlertDialogTitle>Konfirmasi Approval</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menyetujui kas bon <strong>{itemName || 'ini'}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-md">Batal</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isApproving} className="rounded-md btn-primary!">
            {isApproving ? 'Memproses...' : 'Ya, Approve'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
