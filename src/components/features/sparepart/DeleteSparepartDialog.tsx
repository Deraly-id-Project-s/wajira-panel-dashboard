'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparepart } from '@/types/sparepart.types';
import { useDeleteSparepart } from '@/hooks/useSparepart';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sparepart: Sparepart | null;
  companyId: string;
}

export function DeleteSparepartDialog({ open, onOpenChange, sparepart, companyId }: Props) {
  const mutation = useDeleteSparepart(companyId);

  const handleDelete = async () => {
    if (!sparepart) return;

    try {
      await mutation.mutateAsync(sparepart.id);
      toast.success('Data berhasil dihapus');
      onOpenChange(false);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Terjadi kesalahan';
      toast.error(msg);
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Hapus
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
