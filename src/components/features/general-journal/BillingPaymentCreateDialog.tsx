import { useEffect, useState } from 'react';
import { CreditCard, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { Account } from '@/@types/account.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { LedgerAccountSelect } from '@/components/features/laporan-buku-besar/LedgerAccountSelect';
import { LoadingState } from '@/components/ui/loading-state';
import RequiredMark from '@/components/ui/required-mark';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { useCreateGeneralJournalBillingPayment } from '@/hooks/useGeneralJournal';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billingId: number;
  journalId: number;
  totalAmount?: number;
  remainingAmount?: number;
  accounts: Account[];
  isAccountsLoading?: boolean;
  isUsd?: boolean;
}

export default function BillingPaymentCreateDialog({
  open,
  onOpenChange,
  billingId,
  journalId,
  totalAmount,
  remainingAmount = 0,
  accounts,
  isAccountsLoading = false,
  isUsd = false,
}: Props) {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState<string>('');

  const createPaymentMutation = useCreateGeneralJournalBillingPayment(journalId);
  const isBusy = createPaymentMutation.isPending;

  const maxAllowedAmount = totalAmount !== undefined && totalAmount > 0 ? totalAmount : undefined;

  useEffect(() => {
    if (open) {
      setSelectedAccountId(null);
      setNote('');
      if (remainingAmount > 0) {
        const initialVal = maxAllowedAmount !== undefined
          ? Math.min(remainingAmount, maxAllowedAmount)
          : remainingAmount;
        setAmount(initialVal);
      } else {
        setAmount(0);
      }
    }
  }, [open, remainingAmount, maxAllowedAmount]);

  const handleFillRemaining = () => {
    if (remainingAmount > 0) {
      const fillVal = maxAllowedAmount !== undefined
        ? Math.min(remainingAmount, maxAllowedAmount)
        : remainingAmount;
      setAmount(fillVal);
    }
  };

  const handleAmountChange = (val: number) => {
    if (maxAllowedAmount !== undefined && val > maxAllowedAmount) {
      setAmount(maxAllowedAmount);
    } else {
      setAmount(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccountId || selectedAccountId <= 0) {
      toast.error('Pilih akun lawan (COA) terlebih dahulu');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Nominal pembayaran harus lebih dari 0');
      return;
    }

    if (maxAllowedAmount !== undefined && amount > maxAllowedAmount) {
      toast.error(
        `Nominal pembayaran tidak boleh melebihi total kas (${currenciesFormat(isUsd ? 'usd' : 'idr', maxAllowedAmount)})`
      );
      return;
    }

    try {
      await createPaymentMutation.mutateAsync({
        general_journal_billing_id: billingId,
        account_id: selectedAccountId,
        amount,
        amount_original: isUsd ? amount : 0,
        note: note.trim() || null,
      });

      toast.success('Alokasi pembayaran kredit berhasil ditambahkan');
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error) || 'Gagal menambahkan pembayaran billing');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-md p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-100 text-rose-700">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-950">
                Tambah Akun Lawan (Kredit)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Alokasikan akun lawan COA untuk menyeimbangkan nilai kas jurnal umum
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Sisa Alokasi Helper Banner */}
          {remainingAmount > 0 ? (
            <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-800">
              <span>
                Sisa belum dialokasikan:{' '}
                <strong>{currenciesFormat(isUsd ? 'usd' : 'idr', remainingAmount)}</strong>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFillRemaining}
                disabled={isBusy}
                className="h-7 text-xs border-amber-300 text-amber-800 hover:bg-amber-100 bg-white"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                Gunakan Sisa
              </Button>
            </div>
          ) : null}

          {/* Akun COA */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Akun Lawan (COA) <RequiredMark />
            </label>
            <LedgerAccountSelect
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
              options={accounts}
              disabled={isBusy || isAccountsLoading}
              placeholder="Pilih akun lawan (COA)..."
              showAllOption={false}
              className="w-full"
            />
          </div>

          {/* Nominal */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Nominal ({isUsd ? 'USD' : 'IDR'}) <RequiredMark />
              </label>
              {maxAllowedAmount !== undefined && (
                <span className="text-[11px] text-slate-400">
                  Maksimal: {currenciesFormat(isUsd ? 'usd' : 'idr', maxAllowedAmount)}
                </span>
              )}
            </div>
            <MoneyInput
              currency={isUsd ? 'USD' : 'IDR'}
              value={amount}
              max={maxAllowedAmount}
              onChangeValue={handleAmountChange}
              placeholder="0"
              disabled={isBusy}
              className="bg-white h-9"
            />
          </div>

          {/* Keterangan */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Keterangan Pembayaran (Opsional)
            </label>
            <Input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Pembayaran tagihan listrik PLN..."
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
              disabled={
                isBusy ||
                !selectedAccountId ||
                amount <= 0 ||
                (maxAllowedAmount !== undefined && amount > maxAllowedAmount)
              }
            >
              {isBusy ? (
                <LoadingState variant="inline" text="Menyimpan..." iconClassName="text-white" />
              ) : (
                <>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Simpan Pembayaran
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
