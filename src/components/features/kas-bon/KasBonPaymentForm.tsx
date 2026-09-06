import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { DriverCashAdvanceBilling, DriverCashAdvanceBillingHistoryPayload } from '@/@types/driver-cash-advance.types';
import { Button } from '@/components/ui/button';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { LoadingState } from '@/components/ui/loading-state';
import { Textarea } from '@/components/ui/textarea';
import { KasBonPaymentHistoryTable } from './KasBonPaymentHistoryTable';

const schema = z.object({
  bcaIdr: z.number().min(0),
  bcaUsd: z.number().min(0),
  cashIdr: z.number().min(0),
  usdOriginal: z.number().min(0),
  usdExchange: z.number().min(0),
  paymentAt: z.string().min(1, 'Tanggal pembayaran wajib diisi.'),
  note: z.string().max(255, 'Catatan maksimal 255 karakter.'),
}).superRefine((value, context) => {
  if (value.bcaIdr <= 0 && value.bcaUsd <= 0 && value.cashIdr <= 0) {
    context.addIssue({ code: 'custom', path: ['cashIdr'], message: 'Isi minimal satu nominal pembayaran.' });
  }
});

type FormValues = z.infer<typeof schema>;

interface KasBonPaymentFormProps {
  billing: DriverCashAdvanceBilling;
  onSubmit: (payload: DriverCashAdvanceBillingHistoryPayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function KasBonPaymentForm({ billing, onSubmit, onCancel, isSubmitting = false }: KasBonPaymentFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bcaIdr: 0,
      bcaUsd: 0,
      cashIdr: 0,
      usdOriginal: 0,
      usdExchange: 0,
      paymentAt: new Date().toISOString().slice(0, 10),
      note: '',
    },
  });

  const projectedPayment = form.watch('bcaIdr') + form.watch('cashIdr') + form.watch('usdOriginal');
  const remaining = Math.max(0, billing.remainingPayment - projectedPayment);

  const handleSubmit = async (values: FormValues) => {
    if (values.bcaIdr + values.cashIdr + values.usdOriginal > billing.remainingPayment) {
      form.setError('cashIdr', { message: 'Total pembayaran IDR melebihi sisa tagihan.' });
      return;
    }
    try {
      await onSubmit({
        driver_cash_advance_billing_id: billing.id,
        bca_payment_amount: values.bcaIdr,
        bca_payment_usd_amount: values.bcaUsd,
        cash_payment_amount: values.cashIdr,
        bca_payment_usd_original_amount: values.bcaUsd > 0 ? values.usdOriginal : null,
        bca_payment_usd_exchange_amount: values.bcaUsd > 0 ? values.usdExchange : null,
        payment_at: values.paymentAt,
        note: values.note.trim() || null,
      });
      form.reset({ ...form.getValues(), bcaIdr: 0, bcaUsd: 0, cashIdr: 0, usdOriginal: 0, usdExchange: 0, note: '' });
    } catch {
      // Pesan error ditampilkan oleh page agar komponen form tetap reusable.
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-3">
          <div className="space-y-1"><p className="text-xs uppercase text-slate-500">Total Tagihan</p><p className="font-semibold">{currenciesFormat('idr', billing.grandTotal)}</p></div>
          <div className="space-y-1"><p className="text-xs uppercase text-slate-500">Sudah Dibayar</p><p className="font-semibold text-emerald-700">{currenciesFormat('idr', billing.totalPaid)}</p></div>
          <div className="space-y-1"><p className="text-xs uppercase text-slate-500">Sisa Setelah Input</p><p className="font-semibold text-rose-700">{currenciesFormat('idr', remaining)}</p></div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField control={form.control} name="paymentAt" render={({ field }) => <FormItem><FormLabel>Tanggal Bayar</FormLabel><FormControl><Input type="date" {...field} disabled={isSubmitting || billing.isPaid} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="cashIdr" render={({ field }) => <FormItem><FormLabel>Cash IDR</FormLabel><FormControl><MoneyInput value={field.value} onChangeValue={field.onChange} disabled={isSubmitting || billing.isPaid} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="bcaIdr" render={({ field }) => <FormItem><FormLabel>BCA IDR</FormLabel><FormControl><MoneyInput value={field.value} onChangeValue={field.onChange} disabled={isSubmitting || billing.isPaid} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="bcaUsd" render={({ field }) => <FormItem><FormLabel>BCA USD</FormLabel><FormControl><MoneyInput currency="USD" value={field.value} onChangeValue={field.onChange} disabled={isSubmitting || billing.isPaid} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="usdOriginal" render={({ field }) => <FormItem><FormLabel>Nilai Asli USD (IDR)</FormLabel><FormControl><MoneyInput value={field.value} onChangeValue={field.onChange} disabled={isSubmitting || billing.isPaid} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="usdExchange" render={({ field }) => <FormItem><FormLabel>Kurs USD</FormLabel><FormControl><MoneyInput value={field.value} onChangeValue={field.onChange} disabled={isSubmitting || billing.isPaid} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="note" render={({ field }) => <FormItem className="sm:col-span-2 lg:col-span-3"><FormLabel>Catatan</FormLabel><FormControl><Textarea rows={3} placeholder="Catatan pembayaran (opsional)" {...field} disabled={isSubmitting || billing.isPaid} /></FormControl><FormMessage /></FormItem>} />
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
