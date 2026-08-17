import { useMemo } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Upload } from 'lucide-react';
import type { Company } from '@/services/company.service';
import type { KasHarianFormInput, KasHarianFormValues } from '@/scheme/kas-harian.schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  form: UseFormReturn<KasHarianFormInput, unknown, KasHarianFormValues>;
  onSubmit: (data: KasHarianFormValues) => void;
  companies: Company[];
  id?: string;
  lockAmounts?: boolean;
  wrapWithForm?: boolean;
}

export default function KasHarianForm({
  form,
  onSubmit,
  companies,
  id,
  lockAmounts = false,
  wrapWithForm = true,
}: Props) {
  const selectedCompanyId = form.watch('company_id');
  const paymentProof = form.watch('payment_proof');
  const debetAmount = Number(form.watch('debet') ?? 0);
  const creditAmount = Number(form.watch('credit') ?? 0);
  const isDebetDisabled = lockAmounts || creditAmount > 0;
  const isCreditDisabled = lockAmounts || debetAmount > 0;

  const selectedCompany = useMemo(
    () => companies.find((company) => Number(company.id) === Number(selectedCompanyId)),
    [companies, selectedCompanyId],
  );

  const formContent = (
    <>
      <div className="hidden">
        <FormField
          control={form.control}
          name="company_id"
          render={({ field }) => <input autoComplete="off" type="hidden" value={field.value} onChange={field.onChange} />}
        />
      </div>

      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel className="text-base font-medium text-slate-900">Tanggal</FormLabel>
            <FormControl>
              <div className="rounded-md border border-slate-200 bg-white">
                <DatePicker
                  value={field.value instanceof Date ? field.value : null}
                  onChange={(date) => {
                    form.setValue('date', date ?? new Date(''), {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    });
                  }}
                  placeholder="Jan 20, 2025"
                  className="h-12 rounded-md border-0 shadow-none"
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-2">
        <FormLabel className="text-base font-medium text-slate-900">Perusahaan</FormLabel>
        <div className="flex min-h-12 items-center rounded-md border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700">
          {selectedCompany?.name ?? 'Perusahaan belum dipilih'}
        </div>
      </div>

      <FormField
        control={form.control}
        name="transaction_category"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium text-slate-900">Kategori Transaksi</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-12 w-full rounded-md border-slate-200 bg-white px-4">
                  <SelectValue placeholder="Pilih kategori transaksi" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="rounded-md">
                <SelectItem value="general" className="rounded-md">Umum (General)</SelectItem>
                <SelectItem value="operational" className="rounded-md">Operasional (Operational)</SelectItem>
                <SelectItem value="director_receivable" className="rounded-md">Piutang Direktur (Director Receivable)</SelectItem>
                <SelectItem value="shareholder_receivable" className="rounded-md">Piutang Pemegang Saham (Shareholder Receivable)</SelectItem>
                <SelectItem value="receivable" className="rounded-md">Piutang Usaha (Receivable)</SelectItem>
                <SelectItem value="inventory" className="rounded-md">Persediaan (Inventory)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="note"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium text-slate-900">Keterangan</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Tulis deskripsi di sini"
                className="min-h-28 resize-none rounded-md border-slate-200 px-4 py-3"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="debet"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium text-slate-900">Debet</FormLabel>
            <FormControl>
              <MoneyInput
                value={field.value ?? 0}
                onChangeValue={(value) => {
                  if (isDebetDisabled) return;
                  field.onChange(value);
                  if (value > 0) {
                    form.setValue('credit', 0, { shouldDirty: true, shouldValidate: true });
                  }
                }}
                placeholder="Tambahkan nominal"
                className="h-12 rounded-md border-slate-200 px-4"
                disabled={isDebetDisabled}
              />
            </FormControl>
            {lockAmounts ? <p className="text-xs text-slate-500">Nominal debet transaksi otomatis mengikuti data billing dan tidak bisa diubah di sini.</p> : null}
            {!lockAmounts && isDebetDisabled ? <p className="text-xs text-slate-500">Kosongkan kredit untuk mengisi debet.</p> : null}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="credit"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium text-slate-900">Kredit</FormLabel>
            <FormControl>
              <MoneyInput
                value={field.value ?? 0}
                onChangeValue={(value) => {
                  if (isCreditDisabled) return;
                  field.onChange(value);
                  if (value > 0) {
                    form.setValue('debet', 0, { shouldDirty: true, shouldValidate: true });
                  }
                }}
                placeholder="Tambahkan nominal"
                className="h-12 rounded-md border-slate-200 px-4"
                disabled={isCreditDisabled}
              />
            </FormControl>
            {lockAmounts ? <p className="text-xs text-slate-500">Nominal kredit transaksi otomatis mengikuti data billing dan tidak bisa diubah di sini.</p> : null}
            {!lockAmounts && isCreditDisabled ? <p className="text-xs text-slate-500">Kosongkan debet untuk mengisi kredit.</p> : null}
            <FormMessage />
          </FormItem>
        )}
      />


      <FormField
        control={form.control}
        name="payment_proof"
        render={() => (
          <FormItem>
            <FormLabel className="text-base font-medium text-slate-900">Bukti Pembayaran (opsional)</FormLabel>
            <FormControl>
              <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-center">
                <Upload className="mb-3 h-7 w-7 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">{paymentProof ? paymentProof.name : 'Klik untuk upload dokumen'}</span>
                <span className="mt-1 text-xs text-slate-400">PNG, JPG, PDF maksimal 5MB</span>
                <input autoComplete="off"
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(event) => {
                    form.setValue('payment_proof', event.target.files?.[0] ?? null, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    });
                  }}
                />
              </label>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  if (!wrapWithForm) {
    return <Form {...form}>{formContent}</Form>;
  }

  return (
    <Form {...form}>
      <form id={id} onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {formContent}
      </form>
    </Form>
  );
}
