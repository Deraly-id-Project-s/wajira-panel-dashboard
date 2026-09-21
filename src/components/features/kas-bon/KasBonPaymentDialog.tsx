import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type {
  DriverCashAdvanceBilling,
  DriverCashAdvanceBillingHistoryPayload,
} from '@/@types/driver-cash-advance.types';
import { Button } from '@/components/ui/button';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileInput } from '@/components/ui/file-input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { LoadingState } from '@/components/ui/loading-state';
import { MoneyInput } from '@/components/ui/money-input';
import RequiredMark from '@/components/ui/required-mark';
import { Textarea } from '@/components/ui/textarea';

const schema = z
  .object({
    bcaIdr: z.number().min(0),
    bcaUsd: z.number().min(0),
    cashIdr: z.number().min(0),
    paymentAt: z.string().min(1, 'Tanggal pembayaran wajib diisi.'),
    note: z.string().max(255, 'Catatan maksimal 255 karakter.'),
    paymentProof: z
      .any()
      .nullable()
      .refine(
        (file) => !file || (file instanceof File && file.size <= 2 * 1024 * 1024),
        'Ukuran file maksimal 2MB.',
      ),
  })
  .superRefine((value, context) => {
    if (value.bcaIdr <= 0 && value.bcaUsd <= 0 && value.cashIdr <= 0) {
      context.addIssue({
        code: 'custom',
        path: ['cashIdr'],
        message: 'Isi minimal satu nominal pembayaran.',
      });
    }
  });

interface FormValues {
  bcaIdr: number;
  bcaUsd: number;
  cashIdr: number;
  paymentAt: string;
  note: string;
  paymentProof: File | null;
}

interface KasBonPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billing: DriverCashAdvanceBilling;
  subject?: string;
  code?: string | null;
  onSubmit: (payload: DriverCashAdvanceBillingHistoryPayload) => Promise<void>;
  isSubmitting?: boolean;
}

export function KasBonPaymentDialog({
  open,
  onOpenChange,
  billing,
  subject,
  code,
  onSubmit,
  isSubmitting = false,
}: KasBonPaymentDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      bcaIdr: 0,
      bcaUsd: 0,
      cashIdr: 0,
      paymentAt: new Date().toISOString().slice(0, 10),
      note: '',
      paymentProof: null,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        bcaIdr: 0,
        bcaUsd: 0,
        cashIdr: 0,
        paymentAt: new Date().toISOString().slice(0, 10),
        note: '',
        paymentProof: null,
      });
    }
  }, [open, form]);

  const cashIdr = form.watch('cashIdr');
  const bcaIdr = form.watch('bcaIdr');
  const projectedPayment = cashIdr + bcaIdr;
  const maxPaymentAmount = Math.max(0, billing.remainingPayment);
  const remaining = Math.max(0, maxPaymentAmount - projectedPayment);

  const clampIdrPayment = (value: number, otherPayment: number) => (
    Math.min(Math.max(0, value), Math.max(0, maxPaymentAmount - otherPayment))
  );

  const handleSubmit = async (values: FormValues) => {
    if (values.bcaIdr + values.cashIdr > maxPaymentAmount) {
      form.setError('cashIdr', {
        message: 'Total pembayaran IDR melebihi sisa tagihan.',
      });
      return;
    }

    try {
      await onSubmit({
        driver_cash_advance_billing_id: billing.id,
        bca_payment_amount: Math.round(values.bcaIdr),
        bca_payment_usd_amount: Math.round(values.bcaUsd),
        cash_payment_amount: Math.round(values.cashIdr),
        payment_at: values.paymentAt,
        note: values.note.trim() || null,
        payment_proof: values.paymentProof || null,
      });
    } catch {
      // Error handled by parent page
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-md p-0"
        showCloseButton={!isSubmitting}
      >
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            Pembayaran Kas Bon
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-5">
              <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Total Tagihan
                  </p>
                  <p className="font-semibold text-slate-900">
                    {currenciesFormat('idr', billing.grandTotal)}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Sudah Dibayar
                  </p>
                  <p className="font-semibold text-emerald-700">
                    {currenciesFormat('idr', billing.totalPaid)}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Sisa Setelah Input
                  </p>
                  <p className="font-semibold text-rose-700">
                    {currenciesFormat('idr', remaining)}
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <div className="font-semibold">
                  Maksimal nominal: {currenciesFormat('idr', maxPaymentAmount)}
                </div>
                <div className="mt-0.5 text-amber-700">
                  Total tagihan {currenciesFormat('idr', billing.grandTotal)} - total terbayar {currenciesFormat('idr', billing.totalPaid)}.
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="paymentAt"
                  render={({ field }) => (
                    <FormItem className="space-y-2 sm:col-span-2">
                      <FormLabel>
                        Tanggal Bayar <RequiredMark />
                      </FormLabel>
                      <FormControl>
                        <InputDate
                          {...field}
                          disabled={isSubmitting || billing.isPaid}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cashIdr"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Cash IDR</FormLabel>
                      <FormControl>
                        <MoneyInput
                          value={field.value}
                          onChangeValue={(value) => field.onChange(clampIdrPayment(value, bcaIdr))}
                          disabled={isSubmitting || billing.isPaid}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bcaIdr"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>BCA IDR</FormLabel>
                      <FormControl>
                        <MoneyInput
                          value={field.value}
                          onChangeValue={(value) => field.onChange(clampIdrPayment(value, cashIdr))}
                          disabled={isSubmitting || billing.isPaid}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bcaUsd"
                  render={({ field }) => (
                    <FormItem className="space-y-2 sm:col-span-2">
                      <FormLabel>BCA USD</FormLabel>
                      <FormControl>
                        <MoneyInput
                          currency="USD"
                          value={field.value}
                          onChangeValue={field.onChange}
                          disabled={isSubmitting || billing.isPaid}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentProof"
                  render={({ field }) => (
                    <FormItem className="space-y-2 sm:col-span-2">
                      <FormLabel>Bukti Pembayaran</FormLabel>
                      <FormControl>
                        <FileInput
                          value={field.value}
                          onFileChange={field.onChange}
                          accept="image/png,image/jpeg,image/jpg,application/pdf"
                          helperText="Format PNG, JPG, PDF maksimal 2MB"
                          disabled={isSubmitting || billing.isPaid}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem className="space-y-2 sm:col-span-2">
                      <FormLabel>Catatan</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Catatan pembayaran (opsional)"
                          {...field}
                          disabled={isSubmitting || billing.isPaid}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="p-6 pt-4 border-t border-slate-100 bg-slate-50/30 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="btn-primary!"
                disabled={isSubmitting || billing.isPaid}
              >
                {isSubmitting ? (
                  <LoadingState
                    variant="inline"
                    text="Menyimpan..."
                    iconClassName="text-white"
                  />
                ) : (
                  <>
                    {billing.isPaid ? 'Sudah Lunas' : 'Simpan Pembayaran'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
