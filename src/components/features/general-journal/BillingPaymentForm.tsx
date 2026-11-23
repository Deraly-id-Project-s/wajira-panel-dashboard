import { useEffect, useMemo, useState } from 'react';
import { Plus, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Account } from '@/@types/account.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';
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
  remainingDebit?: number;
  remainingCredit?: number;
  isDebitSettled?: boolean;
  isCreditSettled?: boolean;
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
  remainingDebit = 0,
  remainingCredit = 0,
  isDebitSettled = false,
  isCreditSettled = false,
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

  const currency = isUsd ? 'usd' : 'idr';
  const effectiveRemainingDebit = remainingDebit > 0 ? remainingDebit : remainingAmount;
  const activeRemaining = type === 'debit' ? effectiveRemainingDebit : remainingCredit;

  // Initialize default type and amount based on settlement state
  useEffect(() => {
    let nextType: 'debit' | 'credit' = defaultType;
    if (isDebitSettled && !isCreditSettled) {
      nextType = 'credit';
    } else if (!isDebitSettled) {
      nextType = 'debit';
    }
    setType(nextType);
    const initialRemaining = nextType === 'debit' ? effectiveRemainingDebit : remainingCredit;
    setAmount(initialRemaining > 0 ? initialRemaining : 0);
  }, [defaultType, isDebitSettled, isCreditSettled, effectiveRemainingDebit, remainingCredit]);

  const accountOptions = useMemo<SearchableSelectOption[]>(() => {
    return (accounts || []).map((acc) => {
      const rawType = (acc.type || '').toLowerCase();
      const typeLabel = rawType === 'credit' || rawType === 'kredit' ? 'Kredit' : 'Debet';
      return {
        value: String(acc.id),
        label: `[${typeLabel}] ${acc.code} - ${acc.name}`,
      };
    });
  }, [accounts]);

  const handleTypeChange = (nextType: 'debit' | 'credit') => {
    setType(nextType);
    const rem = nextType === 'debit' ? effectiveRemainingDebit : remainingCredit;
    setAmount(rem > 0 ? rem : 0);
  };

  const handleFillRemaining = () => {
    if (activeRemaining > 0) {
      setAmount(activeRemaining);
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

    if (activeRemaining > 0 && amount > activeRemaining) {
      toast.error(
        `Nominal pembayaran (${currenciesFormat(currency, amount)}) melebihi sisa ${type === 'debit' ? 'debet' : 'kredit'} (${currenciesFormat(currency, activeRemaining)})`
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
          ? 'Pembayaran debet berhasil ditambahkan. Jurnal siap ditandai lunas.'
          : 'Pembayaran kredit berhasil ditambahkan.'
      );
      setSelectedAccountId(null);
      setAmount(0);
      setNote('');
    } catch (error) {
      toast.error(getApiErrorMessage(error) || 'Gagal menambahkan pembayaran billing');
    }
  };

  return (
    <CollapsibleBox
      title="Tambah Pembayaran Jurnal (Akun Lawan / COA)"
      description="Input alokasi pembayaran dual: Debet (wajib untuk lunas) dan Kredit (opsional untuk seimbang)."
      icon={CreditCard}
      defaultExpanded={true}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header & Quick Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Arah Pembayaran:</span>
            <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                disabled={disabled || isBusy}
                onClick={() => handleTypeChange('debit')}
                className={cn(
                  'flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors',
                  type === 'debit'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                <span>Debet</span>
                {effectiveRemainingDebit > 0 ? (
                  <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full', type === 'debit' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-600')}>
                    Sisa: {currenciesFormat(currency, effectiveRemainingDebit)}
                  </span>
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
              </button>

              <button
                type="button"
                disabled={disabled || isBusy}
                onClick={() => handleTypeChange('credit')}
                className={cn(
                  'flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors',
                  type === 'credit'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                <span>Kredit</span>
                {remainingCredit > 0 ? (
                  <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full', type === 'credit' ? 'bg-rose-700 text-rose-100' : 'bg-slate-100 text-slate-600')}>
                    Sisa: {currenciesFormat(currency, remainingCredit)}
                  </span>
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>

          {activeRemaining > 0 && !disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFillRemaining}
              disabled={isBusy}
              className="h-8 gap-1.5 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-white"
            >
              Gunakan Sisa {type === 'debit' ? 'Debet' : 'Kredit'} ({currenciesFormat(currency, activeRemaining)})
            </Button>
          )}
        </div>

        {/* Inputs Grid matching Kas Harian Card style */}
        <div className="grid gap-4 sm:grid-cols-12 items-end">
          {/* Akun Lawan (COA) - SearchableSelect */}
          <div className="sm:col-span-4 space-y-1.5 min-w-0">
            <label className="text-xs font-semibold text-slate-700">
              Akun Lawan (COA) <RequiredMark />
            </label>
            <SearchableSelect
              value={selectedAccountId ? String(selectedAccountId) : ''}
              onChange={(val) => setSelectedAccountId(val ? Number(val) : null)}
              options={accountOptions}
              disabled={disabled || isBusy || isAccountsLoading}
              placeholder="Pilih akun lawan (COA)..."
              searchPlaceholder="Cari kode atau nama akun..."
              emptyText="Akun tidak ditemukan"
              loading={isAccountsLoading}
              className="h-10 bg-white"
            />
          </div>

          {/* Nominal Pembayaran */}
          <div className="sm:col-span-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Nominal ({isUsd ? 'USD' : 'IDR'}) <RequiredMark />
              </label>
              {activeRemaining > 0 && (
                <span className="text-[11px] text-slate-500 font-medium">
                  Sisa: {currenciesFormat(currency, activeRemaining)}
                </span>
              )}
            </div>
            <MoneyInput
              currency={isUsd ? 'USD' : 'IDR'}
              value={amount}
              onChangeValue={(val) => setAmount(val)}
              placeholder="0"
              disabled={disabled || isBusy}
              className="bg-white h-10"
            />
          </div>

          {/* Keterangan Pembayaran */}
          <div className="sm:col-span-4 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Catatan Pembayaran (Opsional)
            </label>
            <Input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Pembayaran operasional / beban..."
              disabled={disabled || isBusy}
              className="bg-white h-10 text-xs"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={
              disabled ||
              isBusy ||
              !selectedAccountId ||
              amount <= 0
            }
            className="btn-primary h-10 gap-1.5 text-xs px-5"
          >
            {isBusy ? (
              <LoadingState variant="inline" text="Menyimpan..." iconClassName="text-white" />
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Simpan Pembayaran {type === 'debit' ? 'Debet' : 'Kredit'}
              </>
            )}
          </Button>
        </div>
      </form>
    </CollapsibleBox>
  );
}