import { useMemo } from 'react';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { CalendarDays, FileText, Plus, Trash2, Scale, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Company } from '@/services/company.service';
import type { Account } from '@/@types/account.types';
import type { GeneralJournalFormInput, GeneralJournalFormValues } from '@/scheme/general-journal.schema';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { FileInput } from '@/components/ui/file-input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingState } from '@/components/ui/loading-state';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import { LedgerAccountSelect } from '@/components/features/laporan-buku-besar/LedgerAccountSelect';
import RequiredMark from '@/components/ui/required-mark';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { cn } from '@/lib/utils';

interface Props {
  form: UseFormReturn<GeneralJournalFormValues, any, any>;
  onSubmit: (data: GeneralJournalFormValues) => void | Promise<void>;
  companies: Company[];
  accountOptions: Account[];
  isAccountsLoading?: boolean;
  isBusy?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
  existingPaymentProof?: string | null;
  wrapWithForm?: boolean;
}

export default function GeneralJournalForm({
  form,
  onSubmit,
  companies,
  accountOptions,
  isAccountsLoading = false,
  isBusy = false,
  onCancel,
  submitLabel = 'Simpan Jurnal',
  existingPaymentProof,
  wrapWithForm = true,
}: Props) {
  const selectedCompanyId = form.watch('company_id');
  const paymentProof = form.watch('payment_proof');
  const isUsd = Boolean(form.watch('is_usd_transaction'));

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'billings',
  });

  const billings = form.watch('billings');

  const summary = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;
    let totalDebitOriginal = 0;
    let totalCreditOriginal = 0;

    (billings || []).forEach((item) => {
      const amount = Number(item.amount || 0);
      const amountOriginal = item.amount_original !== undefined && item.amount_original !== null
        ? Number(item.amount_original)
        : (isUsd ? 0 : amount);

      if (item.type === 'debet') {
        totalDebit += amount;
        totalDebitOriginal += amountOriginal;
      } else if (item.type === 'credit') {
        totalCredit += amount;
        totalCreditOriginal += amountOriginal;
      }
    });

    const difference = Math.abs(totalDebit - totalCredit);
    const differenceOriginal = Math.abs(totalDebitOriginal - totalCreditOriginal);

    const isPrimaryBalanced = difference <= 0.01 && (totalDebit > 0 || totalCredit > 0);
    const isOriginalBalanced = !isUsd || (differenceOriginal <= 0.01 && (totalDebitOriginal > 0 || totalCreditOriginal > 0));

    const isBalanced = isPrimaryBalanced && isOriginalBalanced;

    return {
      totalDebit,
      totalCredit,
      difference,
      totalDebitOriginal,
      totalCreditOriginal,
      differenceOriginal,
      isBalanced,
      isPrimaryBalanced,
      isOriginalBalanced,
    };
  }, [billings, isUsd]);

  const formContent = (
    <div className="space-y-6">
      <FormField control={form.control} name="company_id" render={({ field }) => <input type="hidden" value={field.value} onChange={field.onChange} />} />

      {/* Section 1: Informasi Header Jurnal */}
      <CollapsibleBox
        title="Informasi Header Jurnal"
        description="Pilih tanggal pencatatan jurnal umum memorial"
        icon={CalendarDays}
        defaultExpanded={true}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-sm font-medium">
                  Tanggal Jurnal <RequiredMark />
                </FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value instanceof Date ? field.value : null}
                    onChange={(date) => field.onChange(date || new Date())}
                    disabled={isBusy}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_usd_transaction"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-sm font-medium">
                  Mata Uang Transaksi <RequiredMark />
                </FormLabel>
                <Select
                  value={field.value ? 'usd' : 'idr'}
                  onValueChange={(val) => {
                    const isUsdMode = val === 'usd';
                    field.onChange(isUsdMode);
                    if (!isUsdMode) {
                      const billingsList = form.getValues('billings') || [];
                      billingsList.forEach((b, idx) => {
                        form.setValue(`billings.${idx}.amount_original`, b.amount, { shouldDirty: true });
                      });
                    }
                  }}
                  disabled={isBusy}
                >
                  <FormControl>
                    <SelectTrigger className="h-9 bg-white">
                      <SelectValue placeholder="Pilih Mata Uang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="idr">IDR (Indonesian Rupiah - Rp)</SelectItem>
                    <SelectItem value="usd">USD (US Dollar - $)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">Perusahaan</label>
            <div className="flex h-9 w-full items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
              {companies.find((c) => Number(c.id) === Number(selectedCompanyId))?.name || 'Perusahaan Aktif'}
            </div>
            <p className="text-xs text-slate-400">Jurnal dicatat untuk perusahaan aktif yang dipilih</p>
          </div>

          {isUsd ? (
            <div className="sm:col-span-2 rounded-md border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-800 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-blue-900">Mode Transaksi USD Aktif</p>
                <p className="text-blue-700 mt-0.5 leading-relaxed">
                  Setiap baris akun membutuhkan input nominal transaksi dalam <strong>USD ($)</strong> serta nominal ekuivalen dalam <strong>IDR (Rp)</strong> untuk pencatatan buku besar IDR.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </CollapsibleBox>

      {/* Section 2: Baris Transaksi Debet & Kredit */}
      <CollapsibleBox
        title="Rincian Baris Jurnal (Debet & Kredit)"
        description="Masukkan baris akun debet dan kredit. Total debet dan kredit harus bernilai sama (seimbang)."
        icon={Scale}
        defaultExpanded={true}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Daftar Akun Transaksi</p>
              <p className="text-xs text-slate-500">Minimal 2 baris transaksi untuk memenuhi kaidah double-entry bookkeeping</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  account_id: 0,
                  type: 'debet',
                  amount: 0,
                  amount_original: isUsd ? 0 : undefined,
                  payment_at: undefined,
                  note: '',
                })
              }
              disabled={isBusy}
              className="btn-outline h-8 gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Baris
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((fieldItem, index) => {
              const currentAccountId = form.watch(`billings.${index}.account_id`);
              const currentType = form.watch(`billings.${index}.type`);

              return (
                <div
                  key={fieldItem.id}
                  className={cn(
                    'rounded-lg border p-4 transition-colors',
                    currentType === 'debet'
                      ? 'border-emerald-100 bg-emerald-50/20'
                      : 'border-rose-100 bg-rose-50/20',
                  )}
                >
                  <div className="grid gap-3 sm:grid-cols-12 items-start">
                    {/* Akun COA */}
                    <div className={cn(isUsd ? 'sm:col-span-4' : 'sm:col-span-5', 'space-y-1')}>
                      <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span>Akun (COA) <RequiredMark /></span>
                        <span className="text-[10px] text-slate-400">Baris #{index + 1}</span>
                      </label>
                      <LedgerAccountSelect
                        value={currentAccountId ? Number(currentAccountId) : null}
                        onValueChange={(val) => {
                          form.setValue(`billings.${index}.account_id`, val || 0, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                        options={accountOptions}
                        disabled={isBusy || isAccountsLoading}
                      />
                    </div>

                    {/* Posisi: Debet / Kredit */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Posisi <RequiredMark />
                      </label>
                      <Select
                        value={currentType}
                        onValueChange={(val: 'debet' | 'credit') => {
                          form.setValue(`billings.${index}.type`, val, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                        disabled={isBusy}
                      >
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue placeholder="Pilih posisi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="debet" className="text-emerald-700 font-semibold">
                            Debet
                          </SelectItem>
                          <SelectItem value="credit" className="text-rose-700 font-semibold">
                            Kredit
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {isUsd ? (
                      <>
                        {/* Nominal USD */}
                        <div className="sm:col-span-3 space-y-1">
                          <label className="text-xs font-semibold text-blue-800">
                            Nominal USD ($) <RequiredMark />
                          </label>
                          <MoneyInput
                            currency="USD"
                            value={form.watch(`billings.${index}.amount`) || 0}
                            onChangeValue={(val) => {
                              form.setValue(`billings.${index}.amount`, val, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            }}
                            placeholder="0.00"
                            disabled={isBusy}
                            className="bg-white border-blue-200 focus-visible:ring-blue-400"
                          />
                        </div>

                        {/* Ekuivalen IDR */}
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            Ekuivalen IDR (Rp) <RequiredMark />
                          </label>
                          <MoneyInput
                            currency="IDR"
                            value={form.watch(`billings.${index}.amount_original`) || 0}
                            onChangeValue={(val) => {
                              form.setValue(`billings.${index}.amount_original`, val, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            }}
                            placeholder="0"
                            disabled={isBusy}
                            className="bg-white"
                          />
                        </div>
                      </>
                    ) : (
                      /* Nominal IDR */
                      <div className="sm:col-span-4 space-y-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Nominal (IDR) <RequiredMark />
                        </label>
                        <MoneyInput
                          currency="IDR"
                          value={form.watch(`billings.${index}.amount`) || 0}
                          onChangeValue={(val) => {
                            form.setValue(`billings.${index}.amount`, val, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                            form.setValue(`billings.${index}.amount_original`, val, {
                              shouldDirty: true,
                            });
                          }}
                          placeholder="0"
                          disabled={isBusy}
                          className="bg-white"
                        />
                      </div>
                    )}

                    {/* Tombol Hapus Baris */}
                    <div className="sm:col-span-1 flex justify-end pt-5 sm:pt-6">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                        onClick={() => remove(index)}
                        disabled={isBusy || fields.length <= 2}
                        title={fields.length <= 2 ? 'Minimal 2 baris transaksi' : 'Hapus baris'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Keterangan per Baris (Opsional) */}
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <Input
                      placeholder="Keterangan per baris (opsional)..."
                      className="h-8 text-xs bg-white/80"
                      value={form.watch(`billings.${index}.note`) ?? ''}
                      onChange={(e) => {
                        form.setValue(`billings.${index}.note`, e.target.value, {
                          shouldDirty: true,
                        });
                      }}
                      disabled={isBusy}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Balance Indicator & Live Calculation */}
          <div
            className={cn(
              'rounded-lg border p-4 transition-all',
              summary.isBalanced
                ? 'border-emerald-200 bg-emerald-50/50'
                : 'border-amber-200 bg-amber-50/40',
            )}
          >
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <span className="text-slate-500">
                      Total Debet {isUsd ? '(USD)' : ''}:{' '}
                    </span>
                    <span className="font-semibold text-emerald-700 sm:text-sm">
                      {currenciesFormat(isUsd ? 'usd' : 'idr', summary.totalDebit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">
                      Total Kredit {isUsd ? '(USD)' : ''}:{' '}
                    </span>
                    <span className="font-semibold text-rose-700 sm:text-sm">
                      {currenciesFormat(isUsd ? 'usd' : 'idr', summary.totalCredit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">
                      Selisih {isUsd ? '(USD)' : ''}:{' '}
                    </span>
                    <span
                      className={cn(
                        'font-semibold',
                        summary.difference <= 0.01 ? 'text-emerald-700' : 'text-amber-700',
                      )}
                    >
                      {currenciesFormat(isUsd ? 'usd' : 'idr', summary.difference)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 font-semibold">
                  {summary.isBalanced ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      SEIMBANG (BALANCED)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-full text-xs">
                      <AlertCircle className="h-3.5 w-3.5" />
                      BELUM SEIMBANG
                    </span>
                  )}
                </div>
              </div>

              {isUsd ? (
                <div className="flex flex-wrap items-center gap-4 border-t border-slate-200/60 pt-2 text-slate-600">
                  <span className="font-medium text-slate-500">Ekuivalen IDR:</span>
                  <div>
                    <span className="text-slate-500">Debet: </span>
                    <span className="font-semibold text-emerald-700">
                      {currenciesFormat('idr', summary.totalDebitOriginal)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Kredit: </span>
                    <span className="font-semibold text-rose-700">
                      {currenciesFormat('idr', summary.totalCreditOriginal)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Selisih: </span>
                    <span
                      className={cn(
                        'font-semibold',
                        summary.differenceOriginal <= 0.01 ? 'text-emerald-700' : 'text-amber-700',
                      )}
                    >
                      {currenciesFormat('idr', summary.differenceOriginal)}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </CollapsibleBox>

      {/* Section 3: Informasi Tambahan & Bukti */}
      <CollapsibleBox
        title="Informasi Tambahan & Bukti Dokumen"
        description="Tambahkan keterangan umum jurnal dan lampiran dokumen pendukung bila ada."
        icon={FileText}
        defaultExpanded={true}
      >
        <div className="grid gap-5 lg:grid-cols-2 items-stretch">
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-sm font-medium">
                  Keterangan Jurnal <RequiredMark />
                </FormLabel>
                <FormControl className="flex-1 flex flex-col">
                  <Textarea
                    placeholder="Masukkan keterangan jurnal penyesuaian/memorial..."
                    className="flex-1 min-h-32 resize-none bg-white"
                    disabled={isBusy}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_proof"
            render={() => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-sm font-medium">Bukti Dokumen Pendukung (opsional)</FormLabel>
                <FormControl className="flex-1 flex flex-col">
                  <FileInput
                    className="flex-1 flex flex-col"
                    triggerClassName="flex-1 min-h-32"
                    value={paymentProof}
                    onFileChange={(file) =>
                      form.setValue('payment_proof', file, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                    accept="image/jpeg,image/png,application/pdf"
                    helperText="PNG, JPG, atau PDF maksimal 2MB"
                    disabled={isBusy}
                  />
                </FormControl>
                {existingPaymentProof && !paymentProof ? (
                  <p className="text-xs text-slate-500 mt-1">
                    Bukti dokumen tersimpan tetap digunakan jika tidak diganti.
                  </p>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CollapsibleBox>

      {/* Footer Action Buttons */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isBusy}>
            Batal
          </Button>
        ) : null}
        <Button
          type="submit"
          className="btn-primary"
          disabled={isBusy || !summary.isBalanced}
        >
          {isBusy ? <LoadingState variant="inline" text="Menyimpan..." iconClassName="text-white" /> : submitLabel}
        </Button>
      </div>
    </div>
  );

  if (!wrapWithForm) {
    return formContent;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {formContent}
      </form>
    </Form>
  );
}
