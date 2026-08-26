import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteKasHarian } from '@/hooks/useKasHarian';
import type { KasHarian } from '@/types/kas-harian.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: KasHarian | null;
}

export default function DeleteKasHarianDialog({ open, onOpenChange, data }: Props) {
  const { mutateAsync: deleteKasHarian, isPending } = useDeleteKasHarian();

  const handleDelete = async () => {
    if (!data) return;

    try {
      await deleteKasHarian(data.id);
      toast.success('Transaksi kas harian berhasil dihapus');
      onOpenChange(false);
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Gagal menghapus transaksi kas harian';
      toast.error(message);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-[24px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-950">Hapus Data Ini?</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Apa anda yakin ingin menghapus data ini?
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-md border-slate-200"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-md bg-[#ea2626] hover:bg-[#c81f1f] text-white"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? 'Menghapus...' : 'Hapus'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
