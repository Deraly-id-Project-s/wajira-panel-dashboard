'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User } from '@/types/user.types';
import { useDeleteUser } from '@/hooks/useUser';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function DeleteUserDialog({ open, onOpenChange, user }: Props) {
  const mutation = useDeleteUser();
  const isLoading = mutation.isPending;

  const handleDelete = async () => {
    if (!user) return;
    if (isLoading) return;

    try {
      await mutation.mutateAsync(user.id);
      toast.success('Data berhasil dihapus');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || 'Terjadi kesalahan');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus Data Ini?</DialogTitle>
          <DialogDescription>Apa anda yakin ingin menghapus data ini?</DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? 'Menghapus...' : 'Hapus'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
