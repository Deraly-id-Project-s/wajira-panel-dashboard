import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UnitTransactionRefund } from '@/@types/refund.type';
import { createRefundPaymentSchema, type CreateRefundPaymentFormValues } from '@/schemas/refund.schema';
import { useCreateRefundPayment } from '@/hooks/useRefundAdministrasi';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils/currency';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { useKas } from '@/hooks/useKas';
import { LoadingState } from '@/components/ui/loading-state';

interface RefundPaymentModalProps {
  open: boolean;
  onClose: () => void;
  refund: UnitTransactionRefund;
}

export default function RefundPaymentModal({ open, onClose, refund }: RefundPaymentModalProps) {
  const createPaymentMutation = useCreateRefundPayment();
  const { companyId } = useCompany();
  const { data: kasQuery } = useKas(companyId ?? undefined);
  const totalPaid = (refund.payments ?? []).reduce((total, item) => total + Number(item.amount), 0);
  const remainingAmount = Math.max(0, Number(refund.refund_amount) - totalPaid);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRefundPaymentFormValues>({
    resolver: zodResolver(createRefundPaymentSchema),
    defaultValues: {
      unit_transaction_refund_id: refund.id,
      amount: remainingAmount,
      payment_date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (!open) return;

    reset({
      unit_transaction_refund_id: refund.id,
      amount: remainingAmount,
      payment_date: new Date().toISOString().split('T')[0],
    });
  }, [open, refund.id, remainingAmount, reset]);

  const onSubmit = async (values: CreateRefundPaymentFormValues) => {
    if (values.amount > remainingAmount) {
      toast.error('Nominal pembayaran tidak boleh melebihi sisa bayar refund');
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
      await createPaymentMutation.mutateAsync({
        ...values,
        cash_id: resolvedCashId,
      });
      toast.success('Pembayaran refund berhasil ditambahkan');
      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menambahkan pembayaran refund');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Pembayaran Refund</DialogTitle>
          <DialogDescription>
            Refund <span className="font-medium text-slate-900">{refund.code}</span> masih tersisa {formatCurrency(remainingAmount)}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Nominal Refund</span>
              <span className="font-semibold text-slate-900">{formatCurrency(refund.refund_amount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Total Dibayar</span>
              <span className="font-semibold text-slate-900">{formatCurrency(totalPaid)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Sisa Bayar</span>
              <span className="font-semibold text-amber-700">{formatCurrency(remainingAmount)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date">Tanggal Pembayaran</Label>
            <InputDate id="payment_date" {...register('payment_date')} />
            {errors.payment_date ? <p className="text-sm text-red-600">{errors.payment_date.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Nominal Pembayaran</Label>
            <Input id="amount" type="number" min={1} max={remainingAmount || undefined} {...register('amount')} />
            {errors.amount ? <p className="text-sm text-red-600">{errors.amount.message}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={createPaymentMutation.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={createPaymentMutation.isPending || remainingAmount <= 0}>
              {createPaymentMutation.isPending ? <LoadingState variant="inline" text={null} /> : null}
              Simpan Pembayaran
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
