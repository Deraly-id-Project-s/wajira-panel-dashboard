import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToggleKasHarianPostedStatus } from '@/hooks/useKasHarian';
import type { KasHarian } from '@/@types/kas-harian.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: KasHarian | null;
  targetStatus: boolean;
}

export default function TogglePostedStatusDialog({ open, onOpenChange, data, targetStatus }: Props) {
  const { mutateAsync: togglePostedStatus, isPending } = useToggleKasHarianPostedStatus();

  const handleToggle = async () => {
    if (!data) return;

    try {
      await togglePostedStatus({ id: data.id, isPosted: targetStatus });
      toast.success(
        `Status posting jurnal transaksi berhasil diubah menjadi ${targetStatus ? 'Sudah Diposting' : 'Belum Diposting'}`
      );
      onOpenChange(false);
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Gagal mengubah status posting jurnal';
      toast.error(message);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">
            {targetStatus ? 'Posting Jurnal ke Buku Besar?' : 'Batalkan Posting Jurnal?'}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-2">
            {targetStatus
              ? <>Apakah Anda yakin ingin memposting transaksi <strong>{data?.code}</strong> ke buku besar? Transaksi yang diposting akan tercatat resmi pada seluruh laporan keuangan.</>
              : <>Apakah Anda yakin ingin membatalkan status posting transaksi <strong>{data?.code}</strong>? Transaksi tidak akan dimasukkan ke laporan keuangan hingga diposting kembali.</>}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            className="btn-outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            className={targetStatus ? 'btn-primary!' : 'bg-rose-600 hover:bg-rose-700 text-white'}
            onClick={() => void handleToggle()}
            loading={isPending}
          >
            {targetStatus ? 'Ya, Posting' : 'Ya, Batalkan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
