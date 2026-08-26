import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToggleKasHarianPaymentStatus } from '@/hooks/useKasHarian';
import type { KasHarian } from '@/types/kas-harian.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: KasHarian | null;
  targetStatus: boolean;
}

export default function TogglePaymentStatusDialog({ open, onOpenChange, data, targetStatus }: Props) {
  const { mutateAsync: toggleStatus, isPending } = useToggleKasHarianPaymentStatus();

  const handleToggle = async () => {
    if (!data) return;

    try {
      await toggleStatus({ id: data.id, isPaid: targetStatus });
      toast.success(`Status pembayaran transaksi berhasil diubah menjadi ${targetStatus ? 'Lunas' : 'Belum Lunas'}`);
      onOpenChange(false);
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Gagal mengubah status pembayaran';
      toast.error(message);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-[24px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-955">
            {targetStatus ? 'Tandai Sebagai Lunas?' : 'Tandai Sebagai Belum Lunas?'}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-2">
            Apakah Anda yakin ingin menandai transaksi <strong>{data?.code}</strong> ini sebagai {targetStatus ? 'Lunas' : 'Belum Lunas'}?
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
            className={`rounded-md text-white font-medium ${targetStatus ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}
            onClick={() => void handleToggle()}
            disabled={isPending}
          >
            {isPending ? 'Memproses...' : 'Ya, Ubah'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
