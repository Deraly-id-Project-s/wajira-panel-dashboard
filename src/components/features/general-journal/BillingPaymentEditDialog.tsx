import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Account } from '@/@types/account.types';
import type { GeneralJournalBillingPayment } from '@/@types/general-journal.types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { LedgerAccountSelect } from '@/components/features/laporan-buku-besar/LedgerAccountSelect';
import { LoadingState } from '@/components/ui/loading-state';
import RequiredMark from '@/components/ui/required-mark';
import { useUpdateGeneralJournalBillingPayment } from '@/hooks/useGeneralJournal';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: GeneralJournalBillingPayment | null;
  journalId: number;
  accounts: Account[];
  isUsd?: boolean;
}

export default function BillingPaymentEditDialog({
  open,
  onOpenChange,
  payment,
  journalId,
  accounts,
  isUsd = false,
}: Props) {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState<string>('');

  const updateMutation = useUpdateGeneralJournalBillingPayment(journalId);
  const isBusy = updateMutation.isPending;

  useEffect(() => {
    if (payment) {
      setSelectedAccountId(payment.account_id || null);
      setAmount(Number(payment.amount || 0));
      setNote(payment.note || '');
    }
  }, [payment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment?.id) return;

    if (!selectedAccountId || selectedAccountId <= 0) {
      toast.error('Pilih akun lawan (COA) terlebih dahulu');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Nominal pembayaran harus lebih dari 0');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: payment.id,
        payload: {
          account_id: selectedAccountId,
          amount,
          amount_original: isUsd ? amount : 0,
          note: note.trim() || null,
        },
      });

      toast.success('Pembayaran billing berhasil diperbarui');
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error) || 'Gagal memperbarui pembayaran billing');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-950">
            Edit Pembayaran Billing
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Perbarui akun lawan COA atau nominal pembayaran kredit
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Akun Lawan (COA) <RequiredMark />
            </label>
            <LedgerAccountSelect
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
              options={accounts}
              disabled={isBusy}
              placeholder="Pilih akun lawan (COA)..."
              showAllOption={false}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Nominal ({isUsd ? 'USD' : 'IDR'}) <RequiredMark />
            </label>
            <MoneyInput
              currency={isUsd ? 'USD' : 'IDR'}
              value={amount}
              onChangeValue={setAmount}
              placeholder="0"
              disabled={isBusy}
              className="bg-white h-9"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">
              Keterangan Pembayaran
            </label>
            <Input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan pembayaran..."
              disabled={isBusy}
              className="bg-white h-9 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isBusy}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="btn-primary"
              disabled={isBusy || !selectedAccountId || amount <= 0}
            >
              {isBusy ? (
                <LoadingState variant="inline" text="Menyimpan..." iconClassName="text-white" />
              ) : (
                'Simpan Perubahan'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
