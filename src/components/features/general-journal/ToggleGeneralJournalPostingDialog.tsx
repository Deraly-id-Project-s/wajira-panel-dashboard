import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToggleGeneralJournalPaidStatus } from '@/hooks/useGeneralJournal';
import type { GeneralJournal, GeneralJournalListItem } from '@/@types/general-journal.types';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: GeneralJournal | GeneralJournalListItem | null;
  targetStatus: boolean;
}

export default function ToggleGeneralJournalPostingDialog({
  open,
  onOpenChange,
  data,
  targetStatus,
}: Props) {
  const { mutateAsync: toggleStatus, isPending } = useToggleGeneralJournalPaidStatus();

  const handleToggle = async () => {
    if (!data) return;

    try {
      await toggleStatus({ id: data.id, isPaid: targetStatus });
      toast.success(
        targetStatus
          ? `Jurnal umum ${data.code} berhasil ditandai lunas dan diposting ke Laporan Jurnal Umum.`
          : `Status lunas jurnal umum ${data.code} berhasil dibatalkan (unposted).`,
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error) || 'Gagal mengubah status lunas jurnal');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-950">
            {targetStatus ? 'Tandai Lunas Jurnal Umum?' : 'Batal Tandai Lunas Jurnal?'}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-2">
            {targetStatus ? (
              <>
                Jurnal <strong>{data?.code}</strong> akan ditandai lunas dan resmi dibukukan ke{' '}
                <strong>Laporan Jurnal Umum</strong>. Form dan alokasi pembayaran akan terkunci (read-only).
              </>
            ) : (
              <>
                Status lunas jurnal <strong>{data?.code}</strong> akan dibatalkan sehingga data dan alokasi pembayaran dapat diedit kembali.
              </>
            )}
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
            className={targetStatus ? 'btn-success' : 'btn-primary'}
            onClick={() => void handleToggle()}
            loading={isPending}
          >
            {targetStatus ? 'Ya, Tandai Lunas' : 'Ya, Batal Lunas'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
