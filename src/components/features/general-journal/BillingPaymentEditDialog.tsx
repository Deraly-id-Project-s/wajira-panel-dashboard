import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, CreditCard } from 'lucide-react';
import type { Account } from '@/@types/account.types';
import type { GeneralJournalBillingPayment } from '@/@types/general-journal.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { LedgerAccountSelect } from '@/components/features/laporan-buku-besar/LedgerAccountSelect';
import { LoadingState } from '@/components/ui/loading-state';
import RequiredMark from '@/components/ui/required-mark';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { useUpdateGeneralJournalBillingPayment } from '@/hooks/useGeneralJournal';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: GeneralJournalBillingPayment | null;
  journalId: number;
  totalAmount?: number;
  remainingDebit?: number;
  remainingCredit?: number;
  isPaid?: boolean;
  accounts: Account[];
  isUsd?: boolean;
}

export default function BillingPaymentEditDialog({
  open,
  onOpenChange,
  payment,
  journalId,
  totalAmount,
  remainingDebit = 0,
  remainingCredit = 0,
  isPaid = false,
  accounts,
  isUsd = false,
}: Props) {
  const currency = isUsd ? 'usd' : 'idr';
  const paymentType: 'debit' | 'credit' = payment?.type === 'credit' ? 'credit' : 'debit';
  const isDebit = paymentType === 'debit';

  // Per rule 2.2: pembayaran arah debit terkunci jika status jurnal lunas (is_paid = true)
  const isLockedByPosting = isDebit && isPaid;

  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState<string>('');

  const updateMutation = useUpdateGeneralJournalBillingPayment(journalId);
  const isBusy = updateMutation.isPending;

  const currentAmount = Number(payment?.amount || 0);
  const sideRemaining = isDebit ? remainingDebit : remainingCredit;
  const maxAllowedAmount = currentAmount + sideRemaining;

  const handleAmountChange = (val: number) => {
    setAmount(val);
  };

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

    if (isLockedByPosting) {
      toast.error('Pembayaran debet terkunci karena jurnal telah berstatus lunas. Batalkan tandai lunas terlebih dahulu.');
      return;
    }

    if (!selectedAccountId || selectedAccountId <= 0) {
      toast.error('Pilih akun pembayaran (COA) terlebih dahulu');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Nominal pembayaran harus lebih dari 0');
      return;
    }

    if (maxAllowedAmount > 0 && amount > maxAllowedAmount) {
      toast.error(
        `Nominal pembayaran melebihi batas maksimal (${currenciesFormat(currency, maxAllowedAmount)})`,
      );
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: payment.id,
        payload: {
          account_id: selectedAccountId,
          type: paymentType,
          amount,
          amount_original: isUsd ? amount : 0,
          note: note.trim() || null,
        },
      });

      toast.success(
        `Pembayaran ${isDebit ? 'debet' : 'kredit'} billing berhasil diperbarui`,
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error) || 'Gagal memperbarui pembayaran billing');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-md p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md',
                isDebit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
              )}
            >
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-950">
                Edit Pembayaran {isDebit ? 'Debet' : 'Kredit'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Perbarui akun COA atau nominal pembayaran billing
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLockedByPosting ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              Pembayaran debet ini terkunci karena jurnal sudah ditandai lunas. Batalkan tandai lunas jurnal terlebih dahulu jika ingin mengedit pembayaran debet.
            </span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Posisi Pembayaran Info Badge */}
          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
            <span className="text-slate-600 font-medium">Posisi Pembayaran:</span>
            <Badge
              variant="outline"
              className={cn(
                'font-bold uppercase text-[10px] px-2 py-0.5 rounded-full',
                isDebit
                  ? 'border-emerald-300 bg-emerald-100/70 text-emerald-800'
                  : 'border-rose-300 bg-rose-100/70 text-rose-800',
              )}
            >
              {isDebit ? 'Debet (Wajib Lunas)' : 'Kredit (Seimbang)'}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Akun Pembayaran (COA) <RequiredMark />
            </label>
            <LedgerAccountSelect
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
              options={accounts}
              disabled={isBusy || isLockedByPosting}
              placeholder="Pilih akun (COA)..."
              showAllOption={false}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Nominal ({isUsd ? 'USD' : 'IDR'}) <RequiredMark />
              </label>
              {maxAllowedAmount > 0 && (
                <span className="text-[11px] text-slate-500 font-medium">
                  Maks: {currenciesFormat(currency, maxAllowedAmount)}
                </span>
              )}
            </div>
            <MoneyInput
              currency={isUsd ? 'USD' : 'IDR'}
              value={amount}
              max={maxAllowedAmount > 0 ? maxAllowedAmount : undefined}
              onChangeValue={handleAmountChange}
              placeholder="0"
              disabled={isBusy || isLockedByPosting}
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
              disabled={isBusy || isLockedByPosting}
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
              disabled={
                isBusy ||
                isLockedByPosting ||
                !selectedAccountId ||
                amount <= 0 ||
                (maxAllowedAmount > 0 && amount > maxAllowedAmount)
              }
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
