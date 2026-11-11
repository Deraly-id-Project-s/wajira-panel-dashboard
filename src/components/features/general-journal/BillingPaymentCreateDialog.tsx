import { useEffect, useState } from 'react';
import { CreditCard, Plus, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Account } from '@/@types/account.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billingId: number;
  journalId: number;
  totalAmount?: number;
  remainingDebit?: number;
  remainingCredit?: number;
  paidDebit?: number;
  paidCredit?: number;
  isPaid?: boolean;
  defaultType?: 'debit' | 'credit';
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
  remainingDebit = 0,
  remainingCredit = 0,
  paidDebit = 0,
  paidCredit = 0,
  isPaid = false,
  defaultType,
  accounts,
  isAccountsLoading = false,
  isUsd = false,
}: Props) {
  const currency = isUsd ? 'usd' : 'idr';

  // Determine initial type: debit if debit not settled yet and not paid; otherwise credit
  const [type, setType] = useState<'debit' | 'credit'>('debit');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState<string>('');

  const createPaymentMutation = useCreateGeneralJournalBillingPayment(journalId);
  const isBusy = createPaymentMutation.isPending;

  const activeRemaining = type === 'debit' ? remainingDebit : remainingCredit;
  const isDebitLocked = isPaid; // Pembayaran debit terkunci saat jurnal berstatus posted / lunas

  useEffect(() => {
    if (open) {
      setSelectedAccountId(null);
      setNote('');

      // Auto-select type
      let initialType: 'debit' | 'credit' = 'debit';
      if (defaultType) {
        initialType = defaultType;
      } else if (isPaid || remainingDebit <= 0) {
        initialType = 'credit';
      } else {
        initialType = 'debit';
      }
      setType(initialType);

      const rem = initialType === 'debit' ? remainingDebit : remainingCredit;
      setAmount(rem > 0 ? rem : 0);
    }
  }, [open, defaultType, isPaid, remainingDebit, remainingCredit]);

  const handleTypeChange = (nextType: 'debit' | 'credit') => {
    if (nextType === 'debit' && isDebitLocked) return;
    setType(nextType);
    const rem = nextType === 'debit' ? remainingDebit : remainingCredit;
    setAmount(rem > 0 ? rem : 0);
  };

  const handleFillRemaining = () => {
    if (activeRemaining > 0) {
      setAmount(activeRemaining);
    }
  };

  const handleAmountChange = (val: number) => {
    setAmount(val);
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
        `Nominal melebihi sisa kewajiban ${type === 'debit' ? 'debet' : 'kredit'} (${currenciesFormat(currency, activeRemaining)})`,
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

      if (type === 'debit') {
        toast.success('Pembayaran debet berhasil ditambahkan. Jurnal siap ditandai lunas.');
      } else {
        toast.success('Pembayaran kredit berhasil ditambahkan.');
      }
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
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md',
                type === 'debit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
              )}
            >
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-950">
                Tambah Pembayaran Billing
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Alokasi pembayaran dual: Debet (wajib untuk lunas) atau Kredit (opsional untuk seimbang)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Pilihan Tipe Pembayaran (Debet vs Kredit) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Tipe Posisi Pembayaran <RequiredMark />
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Opsi Debet */}
              <button
                type="button"
                disabled={isBusy || isDebitLocked}
                onClick={() => handleTypeChange('debit')}
                className={cn(
                  'flex flex-col items-start p-3 rounded-md border text-left transition-all',
                  type === 'debit'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800',
                  isDebitLocked && 'opacity-50 cursor-not-allowed bg-slate-50',
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold text-sm">Pembayaran Debet</span>
                  <Badge
                    variant="outline"
                    className="border-emerald-300 bg-emerald-100/60 text-emerald-800 text-[10px] px-1.5 py-0"
                  >
                    Wajib Lunas
                  </Badge>
                </div>
                <span className="mt-1 text-[11px] text-slate-500 leading-tight">
                  {isDebitLocked
                    ? 'Terkunci (Jurnal telah diposting)'
                    : remainingDebit > 0
                      ? `Sisa: ${currenciesFormat(currency, remainingDebit)}`
                      : 'Sudah lunas'}
                </span>
              </button>

              {/* Opsi Kredit */}
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleTypeChange('credit')}
                className={cn(
                  'flex flex-col items-start p-3 rounded-md border text-left transition-all',
                  type === 'credit'
                    ? 'border-rose-600 bg-rose-50/70 text-rose-950 ring-1 ring-rose-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800',
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold text-sm">Pembayaran Kredit</span>
                  <Badge
                    variant="outline"
                    className="border-rose-300 bg-rose-100/60 text-rose-800 text-[10px] px-1.5 py-0"
                  >
                    Seimbang
                  </Badge>
                </div>
                <span className="mt-1 text-[11px] text-slate-500 leading-tight">
                  {remainingCredit > 0
                    ? `Sisa: ${currenciesFormat(currency, remainingCredit)}`
                    : 'Sudah seimbang'}
                </span>
              </button>
            </div>
          </div>

          {/* Sisa Alokasi Helper Banner */}
          {activeRemaining > 0 ? (
            <div
              className={cn(
                'flex items-center justify-between rounded-md border px-3 py-2 text-xs',
                type === 'debit'
                  ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                  : 'border-amber-200 bg-amber-50/70 text-amber-900',
              )}
            >
              <span>
                Sisa kewajiban {type === 'debit' ? 'debet' : 'kredit'}:{' '}
                <strong>{currenciesFormat(currency, activeRemaining)}</strong>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFillRemaining}
                disabled={isBusy}
                className={cn(
                  'h-7 text-xs bg-white',
                  type === 'debit'
                    ? 'border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                    : 'border-amber-300 text-amber-800 hover:bg-amber-100',
                )}
              >
                <Sparkles className="mr-1 h-3 w-3" />
                Gunakan Sisa
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                Sisi {type === 'debit' ? 'debet' : 'kredit'} telah terpenuhi penuh ({currenciesFormat(currency, type === 'debit' ? paidDebit : paidCredit)}).
              </span>
            </div>
          )}

          {/* Akun COA */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Akun Pembayaran (COA) <RequiredMark />
            </label>
            <LedgerAccountSelect
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
              options={accounts}
              disabled={isBusy || isAccountsLoading}
              placeholder="Pilih akun (COA)..."
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
              {activeRemaining > 0 && (
                <span className="text-[11px] text-slate-400">
                  Maksimal: {currenciesFormat(currency, activeRemaining)}
                </span>
              )}
            </div>
            <MoneyInput
              currency={isUsd ? 'USD' : 'IDR'}
              value={amount}
              max={activeRemaining > 0 ? activeRemaining : undefined}
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
              placeholder={
                type === 'debit'
                  ? 'Contoh: Pembayaran debit beban operasional...'
                  : 'Contoh: Pembayaran kredit akun lawan kas...'
              }
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
              className={cn(
                'text-white',
                type === 'debit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'btn-primary',
              )}
              disabled={
                isBusy ||
                !selectedAccountId ||
                amount <= 0 ||
                (activeRemaining > 0 && amount > activeRemaining)
              }
            >
              {isBusy ? (
                <LoadingState variant="inline" text="Menyimpan..." iconClassName="text-white" />
              ) : (
                <>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Simpan Pembayaran {type === 'debit' ? 'Debet' : 'Kredit'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
