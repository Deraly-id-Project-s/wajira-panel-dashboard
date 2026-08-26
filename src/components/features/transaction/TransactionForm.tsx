'use client';

import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowDownLeft, ArrowUpRight, Banknote, Landmark, Save, WalletCards } from 'lucide-react';
import { transactionSchema, type TransactionFormValues } from '@/schemas/transaction.schema';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import { MoneyInput } from '@/components/ui/money-input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  defaultValues?: Partial<TransactionFormValues>;
  onSubmit: (data: TransactionFormValues) => Promise<void>;
  onCancel: () => void;
  isBusy?: boolean;
  submitLabel?: string;
}

const emptyValues: TransactionFormValues = {
  date: new Date().toISOString().split('T')[0],
  name: '',
  debitUSD: 0,
  creditUSD: 0,
  debitIDR: 0,
  creditIDR: 0,
  debitCash: 0,
  creditCash: 0,
  description: '',
};

type AmountField = 'debitUSD' | 'creditUSD' | 'debitIDR' | 'creditIDR' | 'debitCash' | 'creditCash';

export default function TransactionForm({ defaultValues, onSubmit, onCancel, isBusy = false, submitLabel = 'Simpan Transaksi' }: Props) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { ...emptyValues, ...defaultValues },
  });

  const hasDebit = Number(form.watch('debitUSD') || 0) > 0
    || Number(form.watch('debitIDR') || 0) > 0
    || Number(form.watch('debitCash') || 0) > 0;
  const hasCredit = Number(form.watch('creditUSD') || 0) > 0
    || Number(form.watch('creditIDR') || 0) > 0
    || Number(form.watch('creditCash') || 0) > 0;

  const setAmount = (field: AmountField, value: number) => {
    form.setValue(field, value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    if (value <= 0) return;

    const oppositeFields: AmountField[] = field.startsWith('debit')
      ? ['creditUSD', 'creditIDR', 'creditCash']
      : ['debitUSD', 'debitIDR', 'debitCash'];
    oppositeFields.forEach((oppositeField) => {
      form.setValue(oppositeField, 0, { shouldDirty: true, shouldValidate: true });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <section className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Informasi Transaksi</h2>
            <p className="mt-1 text-sm text-slate-500">Masukkan identitas utama transaksi operasional.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Tanggal Transaksi</FormLabel>
                <FormControl>
                  <DatePicker value={field.value ? new Date(field.value) : null} onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')} disabled={isBusy} placeholder="Pilih tanggal transaksi" className="w-full" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Transaksi</FormLabel>
                <FormControl><Input placeholder="Masukkan nama transaksi" {...field} disabled={isBusy} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </section>

        <Separator />

        <section className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Nominal Transaksi</h2>
            <p className="mt-1 text-sm text-slate-500">Pilih salah satu sisi transaksi. Debet dan kredit tidak dapat diisi bersamaan.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-5 rounded-md border border-emerald-100 bg-emerald-50/30 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-emerald-100 p-2 text-emerald-700"><ArrowDownLeft className="h-5 w-5" /></div>
                <div><h3 className="font-semibold text-emerald-900">Debet</h3><p className="text-xs text-emerald-700">Penerimaan atau uang masuk</p></div>
              </div>
              <FormField control={form.control} name="debitUSD" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><Landmark className="h-4 w-4 text-slate-400" />Bank USD</FormLabel><FormControl><MoneyInput currency="USD" value={field.value ?? 0} onChangeValue={(value) => setAmount('debitUSD', value)} disabled={isBusy || hasCredit} placeholder="0" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="debitIDR" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><Landmark className="h-4 w-4 text-slate-400" />Bank IDR</FormLabel><FormControl><MoneyInput value={field.value ?? 0} onChangeValue={(value) => setAmount('debitIDR', value)} disabled={isBusy || hasCredit} placeholder="0" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="debitCash" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><Banknote className="h-4 w-4 text-slate-400" />Cash IDR</FormLabel><FormControl><MoneyInput value={field.value ?? 0} onChangeValue={(value) => setAmount('debitCash', value)} disabled={isBusy || hasCredit} placeholder="0" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="space-y-5 rounded-md border border-rose-100 bg-rose-50/30 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-rose-100 p-2 text-rose-700"><ArrowUpRight className="h-5 w-5" /></div>
                <div><h3 className="font-semibold text-rose-900">Kredit</h3><p className="text-xs text-rose-700">Pengeluaran atau uang keluar</p></div>
              </div>
              <FormField control={form.control} name="creditUSD" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><Landmark className="h-4 w-4 text-slate-400" />Bank USD</FormLabel><FormControl><MoneyInput currency="USD" value={field.value ?? 0} onChangeValue={(value) => setAmount('creditUSD', value)} disabled={isBusy || hasDebit} placeholder="0" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="creditIDR" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><WalletCards className="h-4 w-4 text-slate-400" />Bank IDR</FormLabel><FormControl><MoneyInput value={field.value ?? 0} onChangeValue={(value) => setAmount('creditIDR', value)} disabled={isBusy || hasDebit} placeholder="0" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="creditCash" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><Banknote className="h-4 w-4 text-slate-400" />Cash IDR</FormLabel><FormControl><MoneyInput value={field.value ?? 0} onChangeValue={(value) => setAmount('creditCash', value)} disabled={isBusy || hasDebit} placeholder="0" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </div>
        </section>

        <Separator />

        <section className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Informasi Tambahan</h2>
            <p className="mt-1 text-sm text-slate-500">Tambahkan keterangan pendukung bila diperlukan.</p>
          </div>
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Keterangan</FormLabel>
              <FormControl><Textarea placeholder="Masukkan keterangan transaksi" className="min-h-28 resize-none" {...field} disabled={isBusy} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isBusy}>Batal</Button>
          <Button type="submit" className="bg-[#1e3a5f] text-white hover:bg-[#152e4d]" disabled={isBusy}>
            {isBusy ? <LoadingState variant="inline" text="Menyimpan..." iconClassName="text-white" /> : <><Save className="mr-2 h-4 w-4" />{submitLabel}</>}
          </Button>
        </div>
      </form>
    </Form>
  );
}
