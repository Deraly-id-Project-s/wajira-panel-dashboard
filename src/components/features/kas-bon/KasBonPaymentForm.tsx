import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { DriverCashAdvanceBilling, DriverCashAdvanceBillingHistoryPayload } from '@/@types/driver-cash-advance.types';
import { Button } from '@/components/ui/button';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { FileInput } from '@/components/ui/file-input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { LoadingState } from '@/components/ui/loading-state';
import RequiredMark from '@/components/ui/required-mark';
import { Textarea } from '@/components/ui/textarea';
import { KasBonPaymentHistoryTable } from './KasBonPaymentHistoryTable';

const schema = z.object({
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
}).superRefine((value, context) => {
  if (value.bcaIdr <= 0 && value.bcaUsd <= 0 && value.cashIdr <= 0) {
    context.addIssue({ code: 'custom', path: ['cashIdr'], message: 'Isi minimal satu nominal pembayaran.' });
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

interface KasBonPaymentFormProps {
  billing: DriverCashAdvanceBilling;
  onSubmit: (payload: DriverCashAdvanceBillingHistoryPayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function KasBonPaymentForm({ billing, onSubmit, onCancel, isSubmitting = false }: KasBonPaymentFormProps) {
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

  const projectedPayment = form.watch('bcaIdr') + form.watch('cashIdr');
  const remaining = Math.max(0, billing.remainingPayment - projectedPayment);

  const handleSubmit = async (values: FormValues) => {
    if (values.bcaIdr + values.cashIdr > billing.remainingPayment) {
      form.setError('cashIdr', { message: 'Total pembayaran IDR melebihi sisa tagihan.' });
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
      form.reset({
        bcaIdr: 0,
        bcaUsd: 0,
        cashIdr: 0,
        paymentAt: new Date().toISOString().slice(0, 10),
        note: '',
        paymentProof: null,
      });
    } catch {
      // Pesan error ditampilkan oleh page agar komponen form tetap reusable.
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-4 rounded-md border border-slate-200 p-4 sm:grid-cols-3">
          <div className="space-y-1"><p className="text-xs uppercase text-slate-500">Total Tagihan</p><p className="font-semibold">{currenciesFormat('idr', billing.grandTotal)}</p></div>
          <div className="space-y-1"><p className="text-xs uppercase text-slate-500">Sudah Dibayar</p><p className="font-semibold text-emerald-700">{currenciesFormat('idr', billing.totalPaid)}</p></div>
          <div className="space-y-1"><p className="text-xs uppercase text-slate-500">Sisa Setelah Input</p><p className="font-semibold text-rose-700">{currenciesFormat('idr', remaining)}</p></div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="paymentAt"
            render={({ field }) => (
              <FormItem className="space-y-2 sm:col-span-2">
                <FormLabel>Tanggal Bayar <RequiredMark /></FormLabel>
                <FormControl><Input type="date" {...field} disabled={isSubmitting || billing.isPaid} /></FormControl>
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
                <FormControl><MoneyInput value={field.value} onChangeValue={field.onChange} disabled={isSubmitting || billing.isPaid} /></FormControl>
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
                <FormControl><MoneyInput value={field.value} onChangeValue={field.onChange} disabled={isSubmitting || billing.isPaid} /></FormControl>
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
                <FormControl><MoneyInput currency="USD" value={field.value} onChangeValue={field.onChange} disabled={isSubmitting || billing.isPaid} /></FormControl>
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
                <FormControl><Textarea rows={3} placeholder="Catatan pembayaran (opsional)" {...field} disabled={isSubmitting || billing.isPaid} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Kembali</Button>
          <Button type="submit" className="btn-primary!" disabled={isSubmitting || billing.isPaid}>
            {isSubmitting ? <LoadingState variant="inline" text="Menyimpan..." iconClassName="text-white" /> : <><CreditCard className="mr-2 h-4 w-4" />{billing.isPaid ? 'Sudah Lunas' : 'Simpan Pembayaran'}</>}
          </Button>
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-5">
          <h2 className="font-semibold text-slate-900">Riwayat Pembayaran</h2>
          <KasBonPaymentHistoryTable histories={billing.histories} />
        </div>
      </form>
    </Form>
  );
}
