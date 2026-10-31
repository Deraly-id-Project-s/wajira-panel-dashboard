import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteGeneralJournal } from '@/hooks/useGeneralJournal';
import type { GeneralJournalListItem } from '@/@types/general-journal.types';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: GeneralJournalListItem | null;
}

export default function DeleteGeneralJournalDialog({ open, onOpenChange, data }: Props) {
  const { mutateAsync: deleteJournal, isPending } = useDeleteGeneralJournal();

  const handleDelete = async () => {
    if (!data) return;

    try {
      await deleteJournal(data.id);
      toast.success('Jurnal umum berhasil dihapus');
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error) || 'Gagal menghapus jurnal umum');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-950">Hapus Jurnal Umum?</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-2">
            Apakah Anda yakin ingin menghapus jurnal <strong>{data?.code}</strong>? Tindakan ini tidak dapat dibatalkan.
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
            onClick={() => void handleDelete()}
            loading={isPending}
          >
            Hapus
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
