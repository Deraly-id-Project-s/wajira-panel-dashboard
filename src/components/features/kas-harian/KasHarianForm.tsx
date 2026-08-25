import { useMemo } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Save } from 'lucide-react';
import type { Company } from '@/services/company.service';
import type { KasHarianFormInput, KasHarianFormValues } from '@/scheme/kas-harian.schema';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { FileInput } from '@/components/ui/file-input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingState } from '@/components/ui/loading-state';
import { MoneyInput } from '@/components/ui/money-input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  form: UseFormReturn<KasHarianFormInput, unknown, KasHarianFormValues>;
  onSubmit: (data: KasHarianFormValues) => void | Promise<void>;
  companies: Company[];
  id?: string;
  isBusy?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
  existingPaymentProof?: string | null;
  wrapWithForm?: boolean;
}

export default function KasHarianForm({
  form,
  onSubmit,
  companies,
  id,
  isBusy = false,
  onCancel,
  submitLabel = 'Simpan',
  existingPaymentProof,
  wrapWithForm = true,
}: Props) {
  const selectedCompanyId = form.watch('company_id');
  const paymentProof = form.watch('payment_proof');
  const hasDebet = Number(form.watch('debet') ?? 0) > 0 || Number(form.watch('debet_usd') ?? 0) > 0;
  const hasCredit = Number(form.watch('credit') ?? 0) > 0 || Number(form.watch('credit_usd') ?? 0) > 0;

  const selectedCompany = useMemo(
    () => companies.find((company) => Number(company.id) === Number(selectedCompanyId)),
    [companies, selectedCompanyId],
  );

  const setAmount = (field: 'debet' | 'debet_usd' | 'credit' | 'credit_usd', value: number) => {
    form.setValue(field, value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    if (value <= 0) return;

    const oppositeFields = field.startsWith('debet')
      ? (['credit', 'credit_usd'] as const)
      : (['debet', 'debet_usd'] as const);
    oppositeFields.forEach((oppositeField) => {
      form.setValue(oppositeField, 0, { shouldDirty: true, shouldValidate: true });
    });
  };

  const formContent = (
    <div className="space-y-8">
      <FormField control={form.control} name="company_id" render={({ field }) => <input type="hidden" value={field.value} onChange={field.onChange} />} />

      <section className="space-y-5">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Informasi transaksi</h2>
          <p className="mt-1 text-sm text-slate-500">Tentukan tanggal dan perusahaan untuk transaksi kas.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Tanggal Transaksi</FormLabel>
                <FormControl>
                  <DatePicker value={field.value instanceof Date ? field.value : null} onChange={(date) => field.onChange(date ?? new Date(''))} disabled={isBusy} placeholder="Pilih tanggal transaksi" className="h-10 w-full" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Perusahaan</FormLabel>
            <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
              {selectedCompany?.name ?? 'Perusahaan belum dipilih'}
            </div>
          </FormItem>
        </div>
      </section>

      <Separator />

      <section className="space-y-5">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Nominal transaksi</h2>
          <p className="mt-1 text-sm text-slate-500">Pilih salah satu sisi transaksi. Debet dan kredit tidak dapat diisi bersamaan.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-md border border-emerald-100 bg-emerald-50/30 p-5">
            <div><h3 className="font-medium text-emerald-800">Debet</h3><p className="text-xs text-emerald-700/70">Uang masuk</p></div>
            <FormField control={form.control} name="debet" render={({ field }) => (
              <FormItem><FormLabel>Debet IDR</FormLabel><FormControl><MoneyInput value={field.value} onChangeValue={(value) => setAmount('debet', value)} disabled={isBusy || hasCredit} placeholder="0" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="debet_usd" render={({ field }) => (
              <FormItem><FormLabel>Debet USD</FormLabel><FormControl><MoneyInput currency="USD" value={field.value} onChangeValue={(value) => setAmount('debet_usd', value)} disabled={isBusy || hasCredit} placeholder="0" /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          <div className="space-y-4 rounded-md border border-rose-100 bg-rose-50/30 p-5">
            <div><h3 className="font-medium text-rose-800">Kredit</h3><p className="text-xs text-rose-700/70">Uang keluar</p></div>
            <FormField control={form.control} name="credit" render={({ field }) => (
              <FormItem><FormLabel>Kredit IDR</FormLabel><FormControl><MoneyInput value={field.value} onChangeValue={(value) => setAmount('credit', value)} disabled={isBusy || hasDebet} placeholder="0" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="credit_usd" render={({ field }) => (
              <FormItem><FormLabel>Kredit USD</FormLabel><FormControl><MoneyInput currency="USD" value={field.value} onChangeValue={(value) => setAmount('credit_usd', value)} disabled={isBusy || hasDebet} placeholder="0" /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-5">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Lainnya</h2>
          <p className="mt-1 text-sm text-slate-500">Tambahkan keterangan dan bukti pembayaran bila tersedia.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <FormField control={form.control} name="note" render={({ field }) => (
            <FormItem><FormLabel>Keterangan</FormLabel><FormControl><Textarea placeholder="Masukkan keterangan transaksi" className="min-h-32 resize-none" disabled={isBusy} {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="payment_proof" render={() => (
            <FormItem>
              <FormLabel>Bukti Pembayaran (opsional)</FormLabel>
              <FormControl><FileInput value={paymentProof} onFileChange={(file) => form.setValue('payment_proof', file, { shouldDirty: true, shouldTouch: true, shouldValidate: true })} accept="image/jpeg,image/png,application/pdf" helperText="PNG, JPG, atau PDF maksimal 2MB" disabled={isBusy} /></FormControl>
              {existingPaymentProof && !paymentProof ? <p className="text-xs text-slate-500">Bukti pembayaran tersimpan tetap digunakan jika tidak diganti.</p> : null}
              <FormMessage />
            </FormItem>
          )} />
        </div>
      </section>

      {onCancel ? (
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isBusy}>Batal</Button>
          <Button type="submit" className="bg-[#1e3a5f] text-white hover:bg-[#152e4d]" disabled={isBusy}>
            {isBusy ? <LoadingState variant="inline" text="Menyimpan..." iconClassName="text-white" /> : <><Save className="mr-2 h-4 w-4" />{submitLabel}</>}
          </Button>
        </div>
      ) : null}
    </div>
  );

  if (!wrapWithForm) return <Form {...form}>{formContent}</Form>;

  return <Form {...form}><form id={id} onSubmit={form.handleSubmit(onSubmit)}>{formContent}</form></Form>;
}
