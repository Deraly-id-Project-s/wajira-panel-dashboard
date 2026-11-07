import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UnitTransactionRefund, UnitTransactionRefundPayment } from '@/@types/refund.type';
import { useCreateRefundPayment, useUpdateRefundPayment } from '@/hooks/useRefundAdministrasi';
import { createRefundPaymentSchema, type CreateRefundPaymentFormValues } from '@/schemas/refund.schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { InputDate } from '@/components/ui/input-date';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MoneyInput } from '@/components/ui/money-input';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { useKas } from '@/hooks/useKas';
import { LoadingState } from '@/components/ui/loading-state';
import { isKasDisabledForTransaction } from '@/utils/payment-helpers';
import { cn } from '@/lib/utils';

interface PurchaseRefundPaymentDetailModalProps {
  open: boolean;
  onClose: () => void;
  refund: UnitTransactionRefund;
  payment?: UnitTransactionRefundPayment | null;
  entityLabel?: 'Pembelian' | 'Penjualan';
  isUsdTransaction?: boolean;
}

const displayDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().split('T')[0] || '';
};

export default function PurchaseRefundPaymentDetailModal({
  open,
  onClose,
  refund,
  payment,
  entityLabel = 'Pembelian',
  isUsdTransaction,
}: PurchaseRefundPaymentDetailModalProps) {
  const isEdit = Boolean(payment);
  const createMutation = useCreateRefundPayment();
  const updateMutation = useUpdateRefundPayment();
  const { companyId } = useCompany();
  const { data: kasQuery } = useKas(companyId ?? undefined);

  const isUsd = Boolean(
    isUsdTransaction ??
    (refund as any)?.is_usd_transaction ??
    (refund as any)?.unit_transaction?.is_usd_transaction ??
    (refund as any)?.transaction?.is_usd_transaction
  );
  const currencyCode = isUsd ? 'usd' : 'idr';

  const otherPaymentsTotal = (refund.payments ?? []).reduce((total, item) => {
    if (payment && item.id === payment.id) return total;
    return total + Number(item.amount);
  }, 0);
  const remainingAmount = Math.max(0, Number(refund.refund_amount || 0) - otherPaymentsTotal);

  const initialCashId = payment?.cash_id
    ? String(payment.cash_id)
    : (payment as any)?.cash?.id
      ? String((payment as any).cash.id)
      : refund.cash_id
        ? String(refund.cash_id)
        : '';

  const form = useForm<CreateRefundPaymentFormValues>({
    resolver: zodResolver(createRefundPaymentSchema),
    defaultValues: {
      unit_transaction_refund_id: refund.id,
      cash_id: initialCashId,
      payment_date: displayDate(payment?.payment_date || refund.refund_date) || new Date().toISOString().split('T')[0],
      amount: payment?.amount !== undefined && payment?.amount !== null ? Number(payment.amount) : undefined,
      note: payment?.note || '',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      unit_transaction_refund_id: refund.id,
      cash_id: payment?.cash_id
        ? String(payment.cash_id)
        : (payment as any)?.cash?.id
          ? String((payment as any).cash.id)
          : refund.cash_id
            ? String(refund.cash_id)
            : '',
      payment_date: displayDate(payment?.payment_date || refund.refund_date) || new Date().toISOString().split('T')[0],
      amount: payment?.amount !== undefined && payment?.amount !== null ? Number(payment.amount) : undefined,
      note: payment?.note || '',
    });
  }, [form, open, payment, refund.id, refund.refund_date, refund.cash_id]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = form.handleSubmit(async (values) => {
    if (values.amount > remainingAmount) {
      form.setError('amount', {
        type: 'manual',
        message: 'Nominal pembayaran tidak boleh melebihi sisa bayar refund.',
      });
      return;
    }

    const kasList = kasQuery?.data ?? [];
    const validCashAccounts = kasList.filter(
      (cash) => !isKasDisabledForTransaction(cash.currency_type, isUsd, false)
    );
    const defaultCashAccount = validCashAccounts.find((cash) => {
      const code = String(cash.code ?? '').toLowerCase();
      if (isUsd) {
        return code.includes('usd');
      }
      return (code === 'cash_idr' || code === 'cash' || code.includes('cash_idr') || code.includes('cash') || code.includes('kas')) && !code.includes('bca') && !code.includes('usd');
    }) || validCashAccounts[0];

    const resolvedCashId = values.cash_id ? Number(values.cash_id) : defaultCashAccount?.id;

    try {
      if (payment) {
        await updateMutation.mutateAsync({
          id: payment.id,
          payload: {
            unit_transaction_refund_id: values.unit_transaction_refund_id,
            payment_date: values.payment_date,
            amount: values.amount,
            cash_id: resolvedCashId,
            note: values.note || undefined,
          },
        });
        toast.success(`Detail refund ${entityLabel.toLowerCase()} berhasil diperbarui`);
      } else {
        await createMutation.mutateAsync({
          ...values,
          cash_id: resolvedCashId,
          note: values.note || undefined,
        });
        toast.success(`Detail refund ${entityLabel.toLowerCase()} berhasil ditambahkan`);
      }
      onClose();
    } catch (error: any) {
      toast.error(error?.message || `Gagal menyimpan detail refund ${entityLabel.toLowerCase()}`);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[430px] max-h-[800px] rounded-[14px] border-none p-0 shadow-[0_20px_50px_rgba(15,23,42,0.25)] sm:max-w-[430px]">
        <DialogHeader className="px-6 pb-0 pt-7 text-left">
          <DialogTitle className="text-[18px] font-semibold text-[#111827]">
            {isEdit ? `Edit Detail Pembayaran Refund ${entityLabel}` : `Tambah Detail Pembayaran Refund ${entityLabel}`}
          </DialogTitle>
          <p className="text-sm text-[#6B7280]">
            {isEdit ? 'Edit detail pembayaran refund' : 'Tambah detail pembayaran refund'}
          </p>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5 px-6 mb-5">
          <div className="grid gap-3 rounded-[12px] border border-[#D9DEE8] bg-[#F8FAFC] p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">Nominal Refund</span>
              <span className="font-medium text-[#111827]">{currenciesFormat(currencyCode, refund.refund_amount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">Sisa Bayar</span>
              <span className="font-medium text-[#B45309]">{currenciesFormat(currencyCode, remainingAmount)}</span>
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium text-slate-900">Akun Kas / Bank</Label>
            <Controller
              control={form.control}
              name="cash_id"
              render={({ field }) => (
                <Select value={field.value ? String(field.value) : ''} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih akun kas/bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {(kasQuery?.data ?? []).map((k) => {
                      const isUsdKas = String(k.currency_type || '').toLowerCase() === 'usd';
                      const isDisabled = isKasDisabledForTransaction(k.currency_type, isUsd, false);
                      return (
                        <SelectItem key={k.id} value={String(k.id)} disabled={isDisabled}>
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span>{k.cash_name || `${k.code} - ${k.description}`}</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] font-semibold uppercase',
                                isUsdKas
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-200 bg-slate-50 text-slate-600',
                              )}
                            >
                              {k.currency_type || 'IDR'}
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium text-slate-900">Tanggal Refund</Label>
            <Controller
              control={form.control}
              name="payment_date"
              render={({ field }) => <InputDate {...field} />}
            />
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium text-slate-900">
              Nominal Refund ({isUsd ? 'USD' : 'IDR'})
            </Label>
            <Controller
              control={form.control}
              name="amount"
              render={({ field }) => (
                <MoneyInput
                  value={field.value}
                  onChangeValue={(val) => {
                    const clampedAmount = remainingAmount ? Math.min(val, remainingAmount) : val;
                    field.onChange(clampedAmount);
                  }}
                  currency={isUsd ? 'USD' : 'IDR'}
                  placeholder={isUsd ? '$ 0' : 'Rp 0'}
                />
              )}
            />
            {form.formState.errors.amount ? (
              <p className="mt-2 text-sm text-red-600">{form.formState.errors.amount.message}</p>
            ) : (
              <p className="mt-2 text-xs text-[#6B7280]">
                {isUsd
                  ? 'Nominal refund diisi manual dan akan diformat ke USD.'
                  : 'Nominal refund diisi manual dan akan diformat ke IDR.'}
              </p>
            )}
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium text-slate-900">Catatan / Keterangan</Label>
            <Controller
              control={form.control}
              name="note"
              render={({ field }) => (
                <Textarea
                  placeholder="Ketik catatan pembayaran refund..."
                  rows={3}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              )}
            />
          </div>

          <div className="space-y-3 pt-1">
            <Button type="submit" size="sm" className="w-full bg-[#1F3B5B] hover:bg-[#1B3450] text-white" disabled={isPending}>
              {isPending ? <LoadingState variant="inline" text={null} /> : null}
              {isPending ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Simpan')}
            </Button>
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
