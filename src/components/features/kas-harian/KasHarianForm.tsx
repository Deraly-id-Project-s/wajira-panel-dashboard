import { useMemo } from 'react';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { CalendarDays, Coins, FileText, Plus, Trash2 } from 'lucide-react';
import type { Company } from '@/services/company.service';
import type { KasHarianFormInput, KasHarianFormValues } from '@/scheme/kas-harian.schema';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { FileInput } from '@/components/ui/file-input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingState } from '@/components/ui/loading-state';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import { useKas } from '@/hooks/useKas';
import { Badge } from '@/components/ui/badge';
import RequiredMark from '@/components/ui/required-mark';
import { currenciesFormat } from '@/components/ui/currenciesFormat';

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

  const { data: kasResponse, isLoading: isKasLoading } = useKas(selectedCompanyId || undefined);
  const kasList = useMemo(() => kasResponse?.data ?? [], [kasResponse?.data]);

  const selectedCompany = useMemo(
    () => companies.find((company) => Number(company.id) === Number(selectedCompanyId)),
    [companies, selectedCompanyId],
  );

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'cash_flow_cashes',
  });

  const cashFlowCashes = form.watch('cash_flow_cashes');

  const watchedCashes = useMemo(() => cashFlowCashes || [], [cashFlowCashes]);

  // Determine active transaction type (Debit or Kredit) to enforce uniformity constraint
  const activeType = useMemo(() => {
    const found = watchedCashes.find((item) => item.type === 'debet' || item.type === 'credit');
    return (found?.type as 'debet' | 'credit') ?? null;
  }, [watchedCashes]);

  const totalSummary = useMemo(() => {
    let idrTotal = 0;
    let usdTotal = 0;

    watchedCashes.forEach((item) => {
      const kas = kasList.find((k) => Number(k.id) === Number(item.cash_id));
      const amount = Number(item.amount || 0);
      if ((kas?.currency_type || '').toLowerCase() === 'usd') {
        usdTotal += amount;
      } else {
        idrTotal += amount;
      }
    });

    return { idrTotal, usdTotal };
  }, [watchedCashes, kasList]);

  const formContent = (
    <div className="space-y-6">
      <FormField control={form.control} name="company_id" render={({ field }) => <input type="hidden" value={field.value} onChange={field.onChange} />} />

      {/* Section 1: Informasi Transaksi */}
      <CollapsibleBox
        title="Informasi Transaksi"
        description="Tentukan tanggal dan perusahaan untuk transaksi kas harian."
        icon={CalendarDays}
        defaultExpanded={true}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-sm font-medium">
                  Tanggal Transaksi <RequiredMark />
                </FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value instanceof Date ? field.value : null}
                    onChange={(date) => field.onChange(date ?? new Date(''))}
                    disabled={isBusy}
                    placeholder="Pilih tanggal transaksi"
                    className="h-10 w-full bg-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel className="text-sm font-medium">Perusahaan</FormLabel>
            <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 font-medium">
              {selectedCompany?.name ?? 'Perusahaan belum dipilih'}
            </div>
          </FormItem>
        </div>
      </CollapsibleBox>

      {/* Section 2: Informasi Nominal Transaksi */}
      <CollapsibleBox
        title="Informasi Nominal Transaksi"
        description="Pilih data kas, nominal, serta tipe transaksi (Debit/Kredit)."
        icon={Coins}
        defaultExpanded={true}
        actions={
          <div className="flex items-center gap-2">
            {activeType && (
              <Badge
                variant="outline"
                className={
                  activeType === 'debet'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold'
                    : 'border-rose-200 bg-rose-50 text-rose-700 font-semibold'
                }
              >
                {activeType === 'debet' ? 'Mode Debit (Uang Masuk)' : 'Mode Kredit (Uang Keluar)'}
              </Badge>
            )}
          </div>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rincian Kas Transaksi</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Semua rincian kas harus memiliki tipe transaksi yang sama (seluruhnya Debit atau Kredit).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const defaultType = activeType || 'debet';
                append({
                  cash_id: 0,
                  amount: 0,
                  conversion_amount: undefined,
                  type: defaultType,
                });
              }}
              disabled={isBusy}
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Tambah Kas
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((fieldItem, index) => {
              const selectedCashId = form.watch(`cash_flow_cashes.${index}.cash_id`);
              const selectedKas = kasList.find((k) => Number(k.id) === Number(selectedCashId));
              const isUsdCash = (selectedKas?.currency_type || '').toLowerCase() === 'usd';

              return (
                <div
                  key={fieldItem.id}
                  className="relative rounded-lg border border-slate-200 bg-slate-50/40 p-4 transition-colors hover:border-slate-300"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    {/* Data Kas */}
                    <div className={isUsdCash ? 'md:col-span-4' : 'md:col-span-5'}>
                      <FormField
                        control={form.control}
                        name={`cash_flow_cashes.${index}.cash_id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-slate-700">
                              Data Kas <RequiredMark />
                            </FormLabel>
                            <Select
                              value={field.value ? String(field.value) : ''}
                              onValueChange={(val) => field.onChange(Number(val))}
                              disabled={isBusy || isKasLoading}
                            >
                              <FormControl>
                                <SelectTrigger className="h-10 bg-white">
                                  <SelectValue placeholder="Pilih Kas" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isKasLoading && <SelectItem value="loading" disabled>Memuat kas...</SelectItem>}
                                {kasList.map((kas) => {
                                  const isUsd = (kas.currency_type || '').toLowerCase() === 'usd';
                                  return (
                                    <SelectItem key={kas.id} value={String(kas.id)}>
                                      <span className="flex items-center gap-2">
                                        <span className="font-medium">{kas.cash_name || kas.code}</span>
                                        <Badge
                                          variant="outline"
                                          className={
                                            isUsd
                                              ? 'border-blue-200 bg-blue-50 text-blue-700 text-[10px]'
                                              : 'border-slate-200 bg-slate-100 text-slate-700 text-[10px]'
                                          }
                                        >
                                          {isUsd ? 'USD' : 'IDR'}
                                        </Badge>
                                      </span>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Tipe Transaksi (Debit / Kredit) */}
                    <div className="md:col-span-3">
                      <FormField
                        control={form.control}
                        name={`cash_flow_cashes.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-slate-700">
                              Tipe Transaksi <RequiredMark />
                            </FormLabel>
                            <Select
                              value={field.value ?? 'debet'}
                              onValueChange={(val: 'debet' | 'credit') => {
                                field.onChange(val);
                                // Sync all cash_flow_cashes items to the same type to maintain uniform constraint
                                watchedCashes.forEach((_, idx) => {
                                  form.setValue(`cash_flow_cashes.${idx}.type`, val, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  });
                                });
                              }}
                              disabled={isBusy}
                            >
                              <FormControl>
                                <SelectTrigger className="h-10 bg-white">
                                  <SelectValue placeholder="Pilih Tipe" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="debet" disabled={activeType === 'credit'}>
                                  Debit
                                </SelectItem>
                                <SelectItem value="credit" disabled={activeType === 'debet'}>
                                  Kredit
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Nominal */}
                    <div className={isUsdCash ? 'md:col-span-2' : 'md:col-span-3'}>
                      <FormField
                        control={form.control}
                        name={`cash_flow_cashes.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-slate-700">
                              Nominal ({isUsdCash ? 'USD' : 'IDR'}) <RequiredMark />
                            </FormLabel>
                            <FormControl>
                              <MoneyInput
                                currency={isUsdCash ? 'USD' : 'IDR'}
                                value={field.value}
                                onChangeValue={(val) => field.onChange(val)}
                                disabled={isBusy}
                                placeholder="0"
                                className="h-10 bg-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Nominal Konversi (Hanya jika currency == USD) */}
                    {isUsdCash ? (
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name={`cash_flow_cashes.${index}.conversion_amount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-slate-700">
                                Konversi (IDR)
                              </FormLabel>
                              <FormControl>
                                <MoneyInput
                                  currency="IDR"
                                  value={field.value ?? 0}
                                  onChangeValue={(val) => field.onChange(val)}
                                  disabled={isBusy}
                                  placeholder="0"
                                  className="h-10 bg-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : null}

                    {/* Tombol Hapus Baris */}
                    <div className="flex md:h-10 items-end justify-end md:col-span-1">
                      {fields.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          disabled={isBusy}
                          className="h-10 w-10 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Hapus kas ini"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Summary Box */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Total Nominal:</span>
                {totalSummary.idrTotal > 0 && (
                  <Badge variant="outline" className="bg-white border-slate-200 text-slate-900 font-semibold">
                    {currenciesFormat('idr', totalSummary.idrTotal)}
                  </Badge>
                )}
                {totalSummary.usdTotal > 0 && (
                  <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-800 font-semibold">
                    {currenciesFormat('usd', totalSummary.usdTotal)}
                  </Badge>
                )}
                {totalSummary.idrTotal === 0 && totalSummary.usdTotal === 0 && (
                  <span className="text-slate-400">Rp 0</span>
                )}
              </div>
              {activeType && (
                <span className="text-slate-500">
                  Tipe Terpilih: <strong className="uppercase">{activeType === 'debet' ? 'Debit' : 'Kredit'}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      </CollapsibleBox>

      {/* Section 3: Informasi Tambahan & Bukti */}
      <CollapsibleBox
        title="Informasi Tambahan & Bukti"
        description="Tambahkan keterangan transaksi dan unggah bukti pembayaran bila ada."
        icon={FileText}
        defaultExpanded={true}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Keterangan <RequiredMark />
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Masukkan keterangan transaksi kas..."
                    className="min-h-32 resize-none bg-white"
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
              <FormItem>
                <FormLabel className="text-sm font-medium">Bukti Pembayaran (opsional)</FormLabel>
                <FormControl>
                  <FileInput
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
                  <p className="text-xs text-slate-500">Bukti pembayaran tersimpan tetap digunakan jika tidak diganti.</p>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CollapsibleBox>

      {/* Footer Action Buttons */}
      {onCancel ? (
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isBusy}>
            Batal
          </Button>
          <Button type="submit" variant="default" disabled={isBusy} className="bg-orange-600 hover:bg-orange-700 text-white">
            {isBusy ? <LoadingState variant="inline" text="Menyimpan..." iconClassName="text-white" /> : <>{submitLabel}</>}
          </Button>
        </div>
      ) : null}
    </div>
  );

  if (!wrapWithForm) return <Form {...form}>{formContent}</Form>;

  return (
    <Form {...form}>
      <form id={id} onSubmit={form.handleSubmit(onSubmit)}>
        {formContent}
      </form>
    </Form>
  );
}
