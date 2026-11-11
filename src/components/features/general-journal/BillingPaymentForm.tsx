import { useState } from 'react';
import { Plus, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import type { Account } from '@/@types/account.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { LedgerAccountSelect } from '@/components/features/laporan-buku-besar/LedgerAccountSelect';
import { LoadingState } from '@/components/ui/loading-state';
import RequiredMark from '@/components/ui/required-mark';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { useCreateGeneralJournalBillingPayment } from '@/hooks/useGeneralJournal';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { cn } from '@/lib/utils';

interface Props {
  billingId: number;
  journalId: number;
  totalAmount?: number;
  remainingAmount?: number;
  accounts: Account[];
  isAccountsLoading?: boolean;
  disabled?: boolean;
  isUsd?: boolean;
  defaultType?: 'debit' | 'credit';
}

export default function BillingPaymentForm({
  billingId,
  journalId,
  totalAmount,
  remainingAmount = 0,
  accounts,
  isAccountsLoading = false,
  disabled = false,
  isUsd = false,
  defaultType = 'debit',
}: Props) {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [type, setType] = useState<'debit' | 'credit'>(defaultType);
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState<string>('');

  const createPaymentMutation = useCreateGeneralJournalBillingPayment(journalId);
  const isBusy = createPaymentMutation.isPending;

  const maxAllowedAmount = totalAmount !== undefined && totalAmount > 0 ? totalAmount : undefined;

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
        `Nominal pembayaran tidak boleh melebihi total amount (${currenciesFormat(isUsd ? 'usd' : 'idr', maxAllowedAmount)})`
      );
      return;
    }

    try {
      await createPaymentMutation.mutateAsync({
        general_journal_billing_id: billingId,
        account_id: selectedAccountId,
        type,
        amount,
        amount_original: isUsd ? amount : 0,
        note: note.trim() || null,
      });

      toast.success(
        type === 'debit'
          ? 'Pembayaran debet berhasil ditambahkan'
          : 'Pembayaran kredit berhasil ditambahkan'
      );
      setSelectedAccountId(null);
      setAmount(0);
      setNote('');
    } catch (error) {
      toast.error(getApiErrorMessage(error) || 'Gagal menambahkan pembayaran billing');
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Tambah Pembayaran Billing ({type === 'debit' ? 'Debet' : 'Kredit'})
            </h4>
            <p className="text-xs text-slate-500">
              {type === 'debit'
                ? 'Input alokasi pembayaran debet untuk memenuhi syarat lunas'
                : 'Input alokasi akun lawan kredit untuk menyeimbangkan neraca'}
            </p>
          </div>
        </div>

        {remainingAmount > 0 && !disabled ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFillRemaining}
            disabled={isBusy}
            className="h-8 gap-1.5 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-white"
          >
            Gunakan Sisa ({currenciesFormat(isUsd ? 'usd' : 'idr', remainingAmount)})
          </Button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Pilihan Arah Pembayaran (Debet vs Kredit) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Arah Pembayaran:</span>
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setType('debit')}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-semibold transition-colors',
                type === 'debit'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              Debet (Wajib)
            </button>
            <button
              type="button"
              onClick={() => setType('credit')}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-semibold transition-colors',
                type === 'credit'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              Kredit (Seimbang)
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-12 items-end">
          {/* Akun COA */}
          <div className="sm:col-span-4 space-y-1.5 min-w-0">
            <label className="text-xs font-semibold text-slate-700">
              Akun Lawan (COA) <RequiredMark />
            </label>
            <LedgerAccountSelect
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
              options={accounts}
              disabled={disabled || isBusy || isAccountsLoading}
              placeholder="Pilih akun lawan (COA)..."
              showAllOption={false}
              className="w-full"
            />
          </div>

          {/* Nominal Pembayaran */}
          <div className="sm:col-span-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Nominal ({isUsd ? 'USD' : 'IDR'}) <RequiredMark />
              </label>
              {maxAllowedAmount !== undefined && (
                <span className="text-[11px] text-slate-500 font-medium">
                  Maks: {currenciesFormat(isUsd ? 'usd' : 'idr', maxAllowedAmount)}
                </span>
              )}
            </div>
            <MoneyInput
              currency={isUsd ? 'USD' : 'IDR'}
              value={amount}
              max={maxAllowedAmount}
              onChangeValue={handleAmountChange}
              placeholder="0"
              disabled={disabled || isBusy}
              className="bg-white h-9"
            />
          </div>

          {/* Keterangan Pembayaran */}
          <div className="sm:col-span-4 space-y-1.5">
            <label className="text-xs font-medium text-slate-600">
              Keterangan Pembayaran (Opsional)
            </label>
            <Input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Biaya operasional / beban..."
              disabled={disabled || isBusy}
              className="bg-white h-9 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            size="sm"
            disabled={
              disabled ||
              isBusy ||
              !selectedAccountId ||
              amount <= 0 ||
              (maxAllowedAmount !== undefined && amount > maxAllowedAmount)
            }
            className="btn-primary h-9 gap-1.5 text-xs px-4"
          >
            {isBusy ? (
              <LoadingState variant="inline" text="Menyimpan..." iconClassName="text-white" />
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Simpan Pembayaran
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
