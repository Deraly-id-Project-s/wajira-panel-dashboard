import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays } from 'lucide-react';
import type { UnitTransactionRefund, UnitTransactionRefundPayment } from '@/@types/refund.type';
import { useCreateRefundPayment, useUpdateRefundPayment } from '@/hooks/useRefundAdministrasi';
import { createRefundPaymentSchema, type CreateRefundPaymentFormValues } from '@/schemas/refund.schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils/currency';
import { refundInputClassName, refundLabelClassName, refundPrimaryButtonClassName, refundSecondaryButtonClassName } from './purchase-refund.styles';
import { useCompany } from '@/contexts/CompanyContext';
import { useKas } from '@/hooks/useKas';
import { LoadingState } from '@/components/ui/loading-state';

interface PurchaseRefundPaymentDetailModalProps {
  open: boolean;
  onClose: () => void;
  refund: UnitTransactionRefund;
  payment?: UnitTransactionRefundPayment | null;
  entityLabel?: 'Pembelian' | 'Penjualan';
}

const displayDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().split('T')[0] || '';
};

const parseCurrencyInput = (value: string) => {
  const numericValue = value.replace(/[^\d]/g, '');
  return numericValue ? Number(numericValue) : 0;
};

export default function PurchaseRefundPaymentDetailModal({ open, onClose, refund, payment, entityLabel = 'Pembelian' }: PurchaseRefundPaymentDetailModalProps) {
  const isEdit = Boolean(payment);
  const createMutation = useCreateRefundPayment();
  const updateMutation = useUpdateRefundPayment();
  const { companyId } = useCompany();
  const { data: kasQuery } = useKas(companyId ?? undefined);
  const totalPaid = (refund.payments ?? []).reduce((total, item) => {
    if (payment && item.id === payment.id) return total;
    return total + Number(item.amount);
  }, 0);
  const remainingAmount = Math.max(0, Number(refund.remaining_payment ?? Number(refund.refund_amount || 0) - totalPaid));

  const form = useForm<CreateRefundPaymentFormValues>({
    resolver: zodResolver(createRefundPaymentSchema),
    defaultValues: {
      unit_transaction_refund_id: refund.id,
      payment_date: displayDate(payment?.payment_date || refund.refund_date) || new Date().toISOString().split('T')[0],
      amount: payment?.amount !== undefined && payment?.amount !== null ? Number(payment.amount) : undefined,
      note: payment?.note || '',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      unit_transaction_refund_id: refund.id,
      payment_date: displayDate(payment?.payment_date || refund.refund_date) || new Date().toISOString().split('T')[0],
      amount: payment?.amount !== undefined && payment?.amount !== null ? Number(payment.amount) : undefined,
      note: payment?.note || '',
    });
  }, [form, open, payment, refund.id, refund.refund_date, remainingAmount]);

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
    const cashIdrAccount = kasList.find((cash) => {
      const code = String(cash.code ?? '').toLowerCase();
      const desc = String(cash.description ?? '').toLowerCase();
      return (code === 'cash_idr' || code === 'cash' || code.includes('cash_idr') || code.includes('cash') || code.includes('kas')) && !code.includes('bca') && !code.includes('usd');
    });
    const resolvedCashId = cashIdrAccount?.id;

    try {
      if (payment) {
        await updateMutation.mutateAsync({
          id: payment.id,
          payload: {
            unit_transaction_refund_id: values.unit_transaction_refund_id,
            payment_date: values.payment_date,
            amount: values.amount,
            cash_id: resolvedCashId,
          },
        });
        toast.success(`Detail refund ${entityLabel.toLowerCase()} berhasil diperbarui`);
      } else {
        await createMutation.mutateAsync({
          ...values,
          cash_id: resolvedCashId,
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
            {isEdit ? `Edit Detail Refund ${entityLabel}` : `Tambah Detail Refund ${entityLabel}`}
          </DialogTitle>
          <p className="text-sm text-[#6B7280]">{isEdit ? 'Edit detail pembayaran refund' : 'Tambah detail pembayaran refund'}</p>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5 px-6 mb-5">
          <div className="grid gap-3 rounded-[12px] border border-[#D9DEE8] bg-[#F8FAFC] p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">Nominal Refund</span>
              <span className="font-medium text-[#111827]">{formatCurrency(refund.refund_amount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">Sisa Bayar</span>
              <span className="font-medium text-[#B45309]">{formatCurrency(remainingAmount)}</span>
            </div>
          </div>

          <div>
            <Label className={refundLabelClassName}>Tanggal Refund</Label>
            <Controller
              control={form.control}
              name="payment_date"
              render={({ field }) => <InputDate {...field} />}
            />
          </div>

          <div>
            <Label className={refundLabelClassName}>Nominal Refund</Label>
            <Controller
              control={form.control}
              name="amount"
              render={({ field }) => (
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Rp 0"
                  value={field.value === undefined || field.value === null || Number(field.value) === 0 ? '' : formatCurrency(Number(field.value))}
                  onChange={(e) => {
                    const nextAmount = parseCurrencyInput(e.target.value);
                    const clampedAmount = remainingAmount ? Math.min(nextAmount, remainingAmount) : nextAmount;
                    field.onChange(clampedAmount);
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              )}
            />
            {form.formState.errors.amount ? (
              <p className="mt-2 text-sm text-red-600">{form.formState.errors.amount.message}</p>
            ) : (
              <p className="mt-2 text-xs text-[#6B7280]">Nominal refund diisi manual dan akan diformat ke IDR.</p>
            )}
          </div>

          <div className="space-y-3 pt-1">
            <Button type="submit" className={`w-full ${refundPrimaryButtonClassName}`} disabled={isPending}>
              {isPending ? <LoadingState variant="inline" text={null} /> : null}
              Simpan
            </Button>
            <Button type="button" variant="outline" className={`w-full ${refundSecondaryButtonClassName}`} onClick={onClose} disabled={isPending}>
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
