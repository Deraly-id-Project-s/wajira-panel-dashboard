import { useEffect, useMemo } from 'react';
import { useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';
import {
  CalendarDays,
  FileText,
  Plus,
  Trash2,
  Wallet,
  AlertCircle,
  Coins,
} from 'lucide-react';
import type { Company } from '@/services/company.service';
import type { Kas } from '@/@types/kas.types';
import type { GeneralJournalFormValues } from '@/scheme/general-journal.schema';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { FileInput } from '@/components/ui/file-input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingState } from '@/components/ui/loading-state';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import RequiredMark from '@/components/ui/required-mark';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { cn } from '@/lib/utils';

interface Props {
  form: UseFormReturn<GeneralJournalFormValues, any, any>;
  onSubmit: (data: GeneralJournalFormValues) => void | Promise<void>;
  companies?: Company[];
  kasOptions: Kas[];
  isKasLoading?: boolean;
  isBusy?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
  existingPaymentProof?: string | null;
  wrapWithForm?: boolean;
}

export default function GeneralJournalForm({
  form,
  onSubmit,
  companies = [],
  kasOptions,
  isKasLoading = false,
  isBusy = false,
  onCancel,
  submitLabel = 'Simpan Jurnal',
  existingPaymentProof,
  wrapWithForm = true,
}: Props) {
  const paymentProof = form.watch('payment_proof');
  const billings = useWatch({
    control: form.control,
    name: 'billings',
    defaultValue: form.getValues('billings'),
  });
  const transactionType = useWatch({
    control: form.control,
    name: 'type',
    defaultValue: form.getValues('type') || 'debit',
  });
  const isCredit = transactionType === 'credit' || transactionType === 'kredit';

  const { fields: billingFields } = useFieldArray({
    control: form.control,
    name: 'billings',
  });

  // Collect all selected cash IDs across all billings to enforce uniqueness
  const selectedCashIds = useMemo(() => {
    const ids = new Set<number>();
    (billings || []).forEach((b) => {
      (b?.cashes || []).forEach((c) => {
        const id = Number(c?.cash_id);
        if (id && id > 0) {
          ids.add(id);
        }
      });
    });
    return ids;
  }, [billings]);

  // Auto-detect if any selected cash is USD
  const hasUsdCash = useMemo(() => {
    return (billings || []).some((b) =>
      (b?.cashes || []).some((c) => {
        const k = kasOptions.find((opt) => Number(opt.id) === Number(c?.cash_id));
        return String(k?.currency_type || '').toLowerCase() === 'usd';
      }),
    );
  }, [billings, kasOptions]);

  // Keep is_usd_transaction synchronized with whether any selected cash is USD
  useEffect(() => {
    form.setValue('is_usd_transaction', hasUsdCash, { shouldValidate: true, shouldDirty: true });
  }, [hasUsdCash, form]);

  // Calculate grand total cash across all billings
  const summary = useMemo(() => {
    let grandTotalCash = 0;
    let totalCashEntries = 0;

    (billings || []).forEach((b) => {
      (b?.cashes || []).forEach((c) => {
        const amt = Number(c?.amount || 0);
        grandTotalCash += amt;
        if (c?.cash_id && amt > 0) {
          totalCashEntries += 1;
        }
      });
    });

    const isValid = grandTotalCash > 0 && totalCashEntries > 0;

    return {
      grandTotalCash,
      totalCashEntries,
      isValid,
    };
  }, [billings]);

  const formContent = (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="company_id"
        render={({ field }) => (
          <input type="hidden" value={field.value} onChange={field.onChange} />
        )}
      />

      {/* Section Utama: Rincian Transaksi Jurnal Umum dan alokasi Kas */}
      <CollapsibleBox
        title="Rincian Transaksi Jurnal Umum dan alokasi Kas"
        description="Tentukan tanggal transaksi jurnal dan alokasi sumber kas/bank pengeluaran atau penerimaan."
        icon={CalendarDays}
        defaultExpanded={true}
      >
        <div className="space-y-5">
          {/* Tanggal Transaksi Jurnal & Jenis Transaksi Umum */}
          <div className="grid gap-4 sm:grid-cols-2 rounded-lg border border-slate-100 bg-slate-50/70 p-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-semibold text-slate-700">
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
              name="type"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-semibold text-slate-700">
                    Jenis Transaksi Umum <RequiredMark />
                  </FormLabel>
                  <Select
                    value={field.value === 'credit' || field.value === 'kredit' ? 'credit' : 'debit'}
                    onValueChange={(val: 'debit' | 'credit') => {
                      field.onChange(val);
                      // Update all cashes type across billing to match this transaction type
                      const currentBillings = form.getValues('billings') || [];
                      const updated = currentBillings.map((b) => ({
                        ...b,
                        cashes: (b.cashes || []).map((c) => ({
                          ...c,
                          type: val,
                        })),
                      }));
                      form.setValue('billings', updated, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    disabled={isBusy}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9 bg-white text-sm">
                        <SelectValue placeholder="Pilih Jenis Transaksi Umum..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="debit">
                        <span className="font-medium text-emerald-700">Debet</span>
                      </SelectItem>
                      <SelectItem value="credit">
                        <span className="font-medium text-rose-700">Kredit</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Billings & Cashes List */}
          {billingFields.map((billingField, bIndex) => {
            const currentBillingCashes = billings?.[bIndex]?.cashes || [];
            const isMaxKasReached =
              kasOptions.length > 0 && currentBillingCashes.length >= kasOptions.length;

            return (
              <div
                key={billingField.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs space-y-4"
              >
                {/* Multiple Cash Rows */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className=" font-semibold text-slate-800 flex items-center gap-1.5">
                        <Coins className="h-3.5 w-3.5 text-emerald-600" />
                        Daftar Alokasi Kas / Bank
                      </p>
                      <p className="text-slate-400">
                        Pilih kas/bank dan masukkan nominal transaksi (Posisi: {isCredit ? 'Kredit' : 'Debet'})
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const existingCashes = form.getValues(`billings.${bIndex}.cashes`) || [];
                        if (kasOptions.length > 0 && existingCashes.length >= kasOptions.length) {
                          return;
                        }
                        const rawType = form.getValues('type');
                        const currentType: 'credit' | 'debit' =
                          rawType === 'credit' || rawType === 'kredit' ? 'credit' : 'debit';
                        form.setValue(
                          `billings.${bIndex}.cashes`,
                          [
                            ...existingCashes,
                            { cash_id: 0, amount: 0, type: currentType },
                          ],
                          { shouldValidate: true, shouldDirty: true },
                        );
                      }}
                      disabled={
                        isBusy ||
                        isKasLoading ||
                        kasOptions.length === 0 ||
                        isMaxKasReached
                      }
                      title={
                        isMaxKasReached
                          ? `Maksimal ${kasOptions.length} kas telah dipilih`
                          : 'Tambah alokasi kas'
                      }
                      className="h-7  gap-1 border-dashed border-emerald-400 text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Tambah Kas
                    </Button>
                  </div>

                  {/* Cash Inputs List */}
                  <div className="space-y-2.5">
                    {currentBillingCashes.map((cashItem, cIndex) => {
                      const selectedCashId = cashItem?.cash_id;
                      const currentAmount = cashItem?.amount;

                      const selectedCash = kasOptions.find((k) => Number(k.id) === Number(selectedCashId));
                      const rowCurrency: 'IDR' | 'USD' =
                        String(selectedCash?.currency_type || 'idr').toLowerCase() === 'usd' ? 'USD' : 'IDR';

                      return (
                        <div
                          key={cIndex}
                          className="grid gap-3 sm:grid-cols-12 items-center rounded-md border border-slate-100 bg-slate-50/60 p-3 transition-colors hover:border-slate-200"
                        >
                          {/* 1. Kas Selector (Unique across journal) */}
                          <div className="sm:col-span-6 space-y-1">
                            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                              <span>
                                Kas #{cIndex + 1} <RequiredMark />
                              </span>
                            </label>
                            <Select
                              value={selectedCashId ? String(selectedCashId) : ''}
                              onValueChange={(val) => {
                                form.setValue(
                                  `billings.${bIndex}.cashes.${cIndex}.cash_id`,
                                  Number(val),
                                  { shouldValidate: true, shouldDirty: true },
                                );
                              }}
                              disabled={isBusy || isKasLoading}
                            >
                              <SelectTrigger className="h-9 bg-white">
                                <SelectValue placeholder="Pilih Kas / Bank..." />
                              </SelectTrigger>
                              <SelectContent>
                                {kasOptions.length === 0 ? (
                                  <div className="p-2 text-slate-400 text-center text-xs">
                                    {isKasLoading ? 'Memuat data kas...' : 'Belum ada data kas/bank'}
                                  </div>
                                ) : (
                                  kasOptions.map((kas) => {
                                    const isSelectedElsewhere =
                                      Number(kas.id) !== Number(selectedCashId) &&
                                      selectedCashIds.has(Number(kas.id));

                                    const kasCurrencyLabel = (kas.currency_type || 'idr').toUpperCase();

                                    return (
                                      <SelectItem
                                        key={kas.id}
                                        value={String(kas.id)}
                                        disabled={isSelectedElsewhere}
                                        className={cn(
                                          isSelectedElsewhere && 'opacity-50 cursor-not-allowed bg-slate-50',
                                        )}
                                      >
                                        <div className="flex items-center justify-between w-full gap-2">
                                          <div className="flex items-center gap-2 truncate">
                                            <span
                                              className={cn(
                                                'font-medium',
                                                isSelectedElsewhere ? 'text-slate-400' : 'text-slate-900',
                                              )}
                                            >
                                              {kas.cash_name || kas.code}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                              ({kas.type === 'bank' ? 'Bank' : 'Kas'} - {kas.code} - {kasCurrencyLabel})
                                            </span>
                                          </div>
                                          {isSelectedElsewhere ? (
                                            <span className="text-[10px] text-amber-700 font-medium whitespace-nowrap bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                              Sudah dipilih
                                            </span>
                                          ) : null}
                                        </div>
                                      </SelectItem>
                                    );
                                  })
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* 2. Nominal Kas (Otomatis mengikuti currency_type kas) */}
                          <div className="sm:col-span-5 space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              Nominal ({rowCurrency}) <RequiredMark />
                            </label>
                            <MoneyInput
                              currency={rowCurrency}
                              value={currentAmount || 0}
                              onChangeValue={(val) => {
                                form.setValue(
                                  `billings.${bIndex}.cashes.${cIndex}.amount`,
                                  val,
                                  { shouldValidate: true, shouldDirty: true },
                                );
                              }}
                              placeholder="0"
                              disabled={isBusy}
                              className="bg-white h-9"
                            />
                          </div>

                          {/* 3. Tombol Hapus Baris Kas */}
                          <div className="sm:col-span-1 flex justify-start pt-4 sm:pt-4">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => {
                                const updatedCashes = currentBillingCashes.filter(
                                  (_, idx) => idx !== cIndex,
                                );
                                form.setValue(
                                  `billings.${bIndex}.cashes`,
                                  updatedCashes,
                                  { shouldValidate: true, shouldDirty: true },
                                );
                              }}
                              disabled={isBusy || currentBillingCashes.length <= 1}
                              title={
                                currentBillingCashes.length <= 1
                                  ? 'Minimal 1 alokasi kas'
                                  : 'Hapus alokasi kas'
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Live Total Kas (Debet / Kredit) Indicator */}
          <div
            className={cn(
              'rounded-lg border p-4 transition-all',
              summary.isValid
                ? 'border-emerald-200 bg-emerald-50/50'
                : 'border-amber-200 bg-amber-50/40',
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 ">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-slate-500 font-medium">
                    Total Kas ({isCredit ? 'Kredit' : 'Debet'}):{' '}
                  </span>
                  <span
                    className={cn(
                      'text-base font-bold ml-1',
                      isCredit ? 'text-rose-700' : 'text-emerald-700',
                    )}
                  >
                    {currenciesFormat(hasUsdCash ? 'usd' : 'idr', summary.grandTotalCash)}
                  </span>
                </div>
              </div>

              <div>
                {summary.isValid ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-100/70 px-2.5 py-1 rounded-full ">
                    {summary.totalCashEntries} kas teralokasi ({isCredit ? 'Kredit' : 'Debet'})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-800 font-semibold bg-amber-100/70 px-2.5 py-1 rounded-full ">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Tentukan minimal 1 kas dengan nominal &gt; 0
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CollapsibleBox>

      {/* Section 2: Keterangan & Bukti Dokumen */}
      <CollapsibleBox
        title="Keterangan & Bukti Dokumen"
        description="Tambahkan catatan jurnal dan lampiran dokumen bila ada."
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
                    placeholder="Contoh: Pengeluaran operasional logistik cabang..."
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
                <FormLabel className="text-sm font-medium">
                  Bukti Dokumen Pendukung (Opsional)
                </FormLabel>
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
                  <p className=" text-slate-500 mt-1">
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
          disabled={isBusy || !summary.isValid}
        >
          {isBusy ? (
            <LoadingState variant="inline" text="Menyimpan..." iconClassName="text-white" />
          ) : (
            submitLabel
          )}
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
