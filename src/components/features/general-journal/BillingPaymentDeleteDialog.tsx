import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteGeneralJournalBillingPayment } from '@/hooks/useGeneralJournal';
import type { GeneralJournalBillingPayment } from '@/@types/general-journal.types';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: GeneralJournalBillingPayment | null;
  journalId: number;
}

export default function BillingPaymentDeleteDialog({
  open,
  onOpenChange,
  payment,
  journalId,
}: Props) {
  const { mutateAsync: deletePayment, isPending } = useDeleteGeneralJournalBillingPayment(journalId);

  const handleDelete = async () => {
    if (!payment?.id) return;

    try {
      await deletePayment(payment.id);
      toast.success('Pembayaran billing berhasil dihapus');
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error) || 'Gagal menghapus pembayaran billing');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-950">
            Hapus Pembayaran Billing?
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-2">
            Apakah Anda yakin ingin menghapus alokasi pembayaran akun{' '}
            <strong>{payment?.account?.name || payment?.account?.code || '-'}</strong> sebesar{' '}
            <strong>{currenciesFormat('idr', payment?.amount)}</strong>? Tindakan ini tidak dapat dibatalkan.
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
