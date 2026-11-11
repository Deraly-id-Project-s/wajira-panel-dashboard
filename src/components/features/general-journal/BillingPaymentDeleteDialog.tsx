import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
  isPaid?: boolean;
  isUsd?: boolean;
}

export default function BillingPaymentDeleteDialog({
  open,
  onOpenChange,
  payment,
  journalId,
  isPaid = false,
  isUsd = false,
}: Props) {
  const { mutateAsync: deletePayment, isPending } = useDeleteGeneralJournalBillingPayment(journalId);

  const isDebit = payment?.type === 'debit';
  const isLockedByPosting = isDebit && isPaid;

  const handleDelete = async () => {
    if (!payment?.id) return;

    if (isLockedByPosting) {
      toast.error('Pembayaran debet terkunci karena jurnal telah berstatus lunas. Batalkan status lunas terlebih dahulu.');
      return;
    }

    try {
      await deletePayment(payment.id);
      toast.success(
        `Alokasi pembayaran ${isDebit ? 'debet' : 'kredit'} berhasil dihapus`,
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error) || 'Gagal menghapus pembayaran billing');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-md p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-950">
            Hapus Pembayaran {isDebit ? 'Debet' : 'Kredit'}?
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-2">
            Apakah Anda yakin ingin menghapus alokasi pembayaran{' '}
            <strong className="text-slate-800">
              {isDebit ? 'Debet' : 'Kredit'}
            </strong>{' '}
            akun <strong>{payment?.account?.name || payment?.account?.code || '-'}</strong> sebesar{' '}
            <strong>{currenciesFormat(isUsd ? 'usd' : 'idr', payment?.amount)}</strong>? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        {isLockedByPosting ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 mt-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              Pembayaran debet ini tidak dapat dihapus saat jurnal berstatus lunas. Batalkan tandai lunas terlebih dahulu.
            </span>
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
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
            disabled={isPending || isLockedByPosting}
            loading={isPending}
          >
            Hapus
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
