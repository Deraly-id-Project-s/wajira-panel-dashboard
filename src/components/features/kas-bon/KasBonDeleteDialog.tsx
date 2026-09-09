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

interface KasBonDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  itemName?: string;
}

export function KasBonDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
  itemName,
}: KasBonDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-md border-slate-200">
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Kas Bon</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus kas bon <strong>{itemName || 'ini'}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-md">Batal</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isDeleting} className="rounded-md bg-red-600 text-white hover:bg-red-700">
            {isDeleting ? 'Menghapus...' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
