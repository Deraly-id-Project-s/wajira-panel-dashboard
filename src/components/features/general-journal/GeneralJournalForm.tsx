import { useEffect, useMemo } from 'react';
import { useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Company } from '@/services/company.service';
import type { GeneralJournalFormValues } from '@/scheme/general-journal.schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { FileInput } from '@/components/ui/file-input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import RequiredMark from '@/components/ui/required-mark';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { useAccounts } from '@/hooks/useAccount';
import { cn } from '@/lib/utils';

interface Props {
  form: UseFormReturn<GeneralJournalFormValues, any, any>;
  onSubmit: (data: GeneralJournalFormValues) => void | Promise<void>;
  companies?: Company[];
  isBusy?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
  existingPaymentProof?: string | null;
  wrapWithForm?: boolean;
  // Optional backward compatibility props
  kasOptions?: any[];
  isKasLoading?: boolean;
}

export default function GeneralJournalForm({
  form,
  onSubmit,
  isBusy = false,
  onCancel,
  submitLabel = 'Simpan Jurnal',
  existingPaymentProof,
  wrapWithForm = true,
}: Props) {
  const paymentProof = form.watch('payment_proof');
  const selectedCompanyId = form.watch('company_id');
  const watchedAmount = useWatch({ control: form.control, name: 'amount' });
  const watchedType = useWatch({ control: form.control, name: 'type' });

  const targetAmount = Number(watchedAmount || 0);
  const journalType: 'debit' | 'credit' =
    String(watchedType || 'debit').toLowerCase() === 'credit' || String(watchedType || '').toLowerCase() === 'kredit'
      ? 'credit'
      : 'debit';

  // Query akun/COA milik perusahaan yang dipilih
  const accountQuery = useAccounts({
    page: 1,
    perPage: 1000,
    search: '',
    company_id: selectedCompanyId ? Number(selectedCompanyId) : undefined,
    enabled: Boolean(selectedCompanyId),
  });
  const akunOptions = useMemo(() => accountQuery.data?.data ?? [], [accountQuery.data?.data]);

  // Field Array untuk rincian pembayaran jurnal
  const {
    fields: paymentFields,
    append: appendPayment,
    remove: removePayment,
  } = useFieldArray({
    control: form.control,
    name: 'payments',
  });

  const watchedPayments = useWatch({
    control: form.control,
    name: 'payments',
    defaultValue: form.getValues('payments') || [],
  });

  // Pastikan selalu ada default dan minimum 1 baris
  useEffect(() => {
    if (!paymentFields || paymentFields.length === 0) {
      appendPayment({
        account_id: 0,
        debit: 0,
        credit: 0,
        note: '',
      });
    }
  }, [paymentFields, appendPayment]);

  // Set ID akun yang sudah dipilih untuk mencegah pemilihan berulang
  const selectedAccountIds = useMemo(() => {
    const ids = new Set<number>();
    (watchedPayments || []).forEach((p) => {
      const id = Number(p?.account_id);
      if (id && id > 0) {
        ids.add(id);
      }
    });
    return ids;
  }, [watchedPayments]);

  // Perhitungan total debit dan kredit
  const { totalDebit, totalCredit } = useMemo(() => {
    let debit = 0;
    let credit = 0;
    (watchedPayments || []).forEach((p) => {
      debit += Number(p?.debit || 0);
      credit += Number(p?.credit || 0);
    });
    return { totalDebit: debit, totalCredit: credit };
  }, [watchedPayments]);

  // Sisa kewajiban pembayaran terhadap batas nominal jurnal
  const remainingDebit = Math.max(0, targetAmount - totalDebit);
  const remainingCredit = Math.max(0, targetAmount - totalCredit);

  // Status penyelesaian sisi
  const isDebitSettled = targetAmount > 0 && totalDebit === targetAmount;
  const isCreditSettled = targetAmount > 0 && totalCredit === targetAmount;

  // Sisi yang sama dengan tipe jurnal WAJIB LUNAS
  const isPrimarySettled = journalType === 'debit' ? isDebitSettled : isCreditSettled;

  // Jurnal seimbang jika kedua sisi (debit dan kredit) terpenuhi penuh
  const isBalanced = targetAmount > 0 && isDebitSettled && isCreditSettled;

  // Indikator kedua sisi telah mencapai batas maksimal
  const isBothFull = targetAmount > 0 && totalDebit >= targetAmount && totalCredit >= targetAmount;

  // Helper batas maksimal per baris
  const getMaxDebitForRow = (index: number) => {
    if (targetAmount <= 0) return 0;
    const currentVal = Number(watchedPayments?.[index]?.debit || 0);
    const otherRowsDebit = totalDebit - currentVal;
    return Math.max(0, targetAmount - otherRowsDebit);
  };

  const getMaxCreditForRow = (index: number) => {
    if (targetAmount <= 0) return 0;
    const currentVal = Number(watchedPayments?.[index]?.credit || 0);
    const otherRowsCredit = totalCredit - currentVal;
    return Math.max(0, targetAmount - otherRowsCredit);
  };

  // Cek apakah seluruh baris pembayaran sudah terisi lengkap dan valid
  const isPaymentDataValid = useMemo(() => {
    if (targetAmount <= 0) return false;
    if (!watchedPayments || watchedPayments.length === 0) return false;
    for (const p of watchedPayments) {
      const accId = Number(p?.account_id || 0);
      const deb = Number(p?.debit || 0);
      const cred = Number(p?.credit || 0);
      if (accId <= 0) return false;
      if (deb <= 0 && cred <= 0) return false;
      if (deb > 0 && cred > 0) return false;
    }
    if (totalDebit > targetAmount || totalCredit > targetAmount) return false;
    return isPrimarySettled;
  }, [targetAmount, watchedPayments, totalDebit, totalCredit, isPrimarySettled]);

  // Salin baris data (copy nominal dan catatan saja, dibatasi kapasitas tersisa)
  const handleCopyRow = (index: number) => {
    const currentRow = form.getValues(`payments.${index}`);
    const deb = Number(currentRow?.debit || 0);
    const cred = Number(currentRow?.credit || 0);

    const availableDebit = targetAmount > 0 ? Math.max(0, targetAmount - totalDebit) : deb;
    const availableCredit = targetAmount > 0 ? Math.max(0, targetAmount - totalCredit) : cred;

    appendPayment({
      account_id: 0,
      debit: deb > 0 ? Math.min(deb, availableDebit) : 0,
      credit: cred > 0 ? Math.min(cred, availableCredit) : 0,
      note: currentRow?.note || '',
    });
    toast.info('Baris pembayaran berhasil disalin. Silakan pilih akun COA untuk baris baru.');
  };

  // Hapus atau reset baris (jika baris sisa 1, kosongkan baris tersebut)
  const handleDeleteRow = (index: number) => {
    if (paymentFields.length <= 1) {
      form.setValue('payments.0', {
        account_id: 0,
        debit: 0,
        credit: 0,
        note: '',
      }, { shouldValidate: true, shouldDirty: true });
      toast.info('Baris pembayaran telah dikosongkan');
    } else {
      removePayment(index);
    }
  };

  // Validasi mendalam sebelum pengiriman form
  const validateBeforeSubmit = (values: GeneralJournalFormValues, isMarkPaidAction: boolean): boolean => {
    const currentTargetAmount = Number(values.amount || 0);
    if (!currentTargetAmount || currentTargetAmount <= 0) {
      toast.error('Nominal jurnal umum wajib diisi dan harus lebih dari 0');
      return false;
    }

    if (!values.note || !values.note.trim()) {
      toast.error('Keterangan jurnal wajib diisi');
      return false;
    }

    if (!values.payments || values.payments.length === 0) {
      toast.error('Minimal harus terdapat 1 baris rincian pembayaran jurnal');
      return false;
    }

    let calculatedDebit = 0;
    let calculatedCredit = 0;

    for (let i = 0; i < values.payments.length; i++) {
      const row = values.payments[i];
      const rowNum = i + 1;
      const accId = Number(row.account_id);
      const deb = Number(row.debit || 0);
      const cred = Number(row.credit || 0);

      calculatedDebit += deb;
      calculatedCredit += cred;

      if (!accId || accId <= 0) {
        toast.error(`Akun belum dipilih pada baris ke-${rowNum}`);
        return false;
      }
      if (deb <= 0 && cred <= 0) {
        toast.error(`Nominal debit atau kredit harus lebih dari 0 pada baris ke-${rowNum}`);
        return false;
      }
      if (deb > 0 && cred > 0) {
        toast.error(`Wajib memilih salah satu antara debit atau kredit pada baris ke-${rowNum}`);
        return false;
      }
    }

    // Validasi batas maksimal nominal jurnal
    if (calculatedDebit > currentTargetAmount) {
      toast.error(
        `Total pembayaran debit (${currenciesFormat('idr', calculatedDebit)}) melebihi batas nominal jurnal (${currenciesFormat('idr', currentTargetAmount)})`,
      );
      return false;
    }

    if (calculatedCredit > currentTargetAmount) {
      toast.error(
        `Total pembayaran kredit (${currenciesFormat('idr', calculatedCredit)}) melebihi batas nominal jurnal (${currenciesFormat('idr', currentTargetAmount)})`,
      );
      return false;
    }

    // Validasi pembayaran WAJIB LUNAS untuk tipe yang sama dengan general journalnya
    const currentJournalType =
      String(values.type).toLowerCase() === 'credit' || String(values.type).toLowerCase() === 'kredit'
        ? 'credit'
        : 'debit';

    if (currentJournalType === 'debit' && calculatedDebit !== currentTargetAmount) {
      toast.error(
        `Pembayaran debit wajib lunas sesuai nominal jurnal umum (${currenciesFormat('idr', currentTargetAmount)}). Saat ini: ${currenciesFormat('idr', calculatedDebit)}.`,
      );
      return false;
    }

    if (currentJournalType === 'credit' && calculatedCredit !== currentTargetAmount) {
      toast.error(
        `Pembayaran kredit wajib lunas sesuai nominal jurnal umum (${currenciesFormat('idr', currentTargetAmount)}). Saat ini: ${currenciesFormat('idr', calculatedCredit)}.`,
      );
      return false;
    }

    if (isMarkPaidAction) {
      if (currentJournalType === 'debit' && calculatedDebit < currentTargetAmount) {
        toast.error('Pembayaran debit belum lunas untuk menandai jurnal sebagai lunas.');
        return false;
      }
      if (currentJournalType === 'credit' && calculatedCredit < currentTargetAmount) {
        toast.error('Pembayaran kredit belum lunas untuk menandai jurnal sebagai lunas.');
        return false;
      }
    }

    return true;
  };

  // Handler Submit Biasa (Draft: is_paid = false)
  const handleSaveDraft = () => {
    const currentValues = form.getValues();
    if (!validateBeforeSubmit(currentValues, false)) return;
    form.setValue('is_paid', false);
    form.handleSubmit(onSubmit)();
  };

  // Handler Submit Tandai Lunas (is_paid = true)
  const handleMarkPaid = () => {
    const currentValues = form.getValues();
    if (!validateBeforeSubmit(currentValues, true)) return;
    form.setValue('is_paid', true);
    form.handleSubmit(onSubmit)();
  };

  const formContent = (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="company_id"
        render={({ field }) => (
          <input type="hidden" value={field.value} onChange={field.onChange} />
        )}
      />

      {/* Section 1: Informasi Jurnal Umum (Type & Amount Utama) */}
      <CollapsibleBox
        title="Informasi Jurnal Umum"
        description="Tentukan tanggal transaksi, tipe jurnal, nominal utama, keterangan transaksi, dan lampiran dokumen pendukung."
        icon={FileText}
        defaultExpanded={true}
      >
        <div className="grid gap-5 lg:grid-cols-2 items-start">
          {/* Kolom Kiri: Tanggal, Tipe Jurnal & Nominal Jurnal */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-semibold text-slate-700">
                    Tanggal Jurnal Umum <RequiredMark />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tipe Transaksi Jurnal Umum (Debet / Kredit) */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm font-semibold text-slate-700">
                      Tipe Jurnal Umum <RequiredMark />
                    </FormLabel>
                    <Select
                      value={field.value === 'credit' || field.value === 'kredit' ? 'credit' : 'debit'}
                      onValueChange={(val: 'debit' | 'credit') => field.onChange(val)}
                      disabled={isBusy}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 bg-white text-xs">
                          <SelectValue placeholder="Pilih Tipe Jurnal..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="debit">
                          <span className="font-semibold text-emerald-700">Debet</span>
                        </SelectItem>
                        <SelectItem value="credit">
                          <span className="font-semibold text-rose-700">Kredit</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nominal Transaksi Jurnal Umum (Wajib > 0) */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm font-semibold text-slate-700">
                      Nominal Jurnal (IDR) <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <MoneyInput
                        currency="IDR"
                        value={field.value || 0}
                        onChangeValue={(val) => field.onChange(val)}
                        placeholder="0"
                        disabled={isBusy}
                        className="h-9 bg-white text-xs font-semibold"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-semibold text-slate-700">
                    Keterangan Jurnal <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: Pengeluaran operasional logistik cabang..."
                      className="min-h-24 resize-none bg-white text-xs"
                      disabled={isBusy}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Kolom Kanan: Bukti Dokumen Pendukung */}
          <FormField
            control={form.control}
            name="payment_proof"
            render={() => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-sm font-semibold text-slate-700">
                  Bukti Dokumen Pendukung (Opsional)
                </FormLabel>
                <FormControl>
                  <FileInput
                    className="flex flex-col"
                    triggerClassName="min-h-52"
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

      {/* Section 2: Rincian Pembayaran Jurnal (Tabel Entri Terbatas Nominal Jurnal) */}
      <CollapsibleBox
        title="Rincian Pembayaran Jurnal"
        description="Entri pembayaran debit dan kredit jurnal umum (maksimal dibatasi nominal jurnal, posisi utama wajib lunas)."
        icon={CreditCard}
        defaultExpanded={true}
      >
        <div className="space-y-4">
          {/* Header Info / Status Keseimbangan */}
          <div className="flex flex-col items-stretch gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-slate-600 font-medium">
                Target Nominal: <span className="font-bold text-slate-900">{currenciesFormat('idr', targetAmount)}</span>
                {' '}&bull; Posisi Utama:{' '}
                <span className={cn('font-bold', journalType === 'debit' ? 'text-emerald-700' : 'text-rose-700')}>
                  {journalType === 'debit' ? 'Debet (Wajib Lunas)' : 'Kredit (Wajib Lunas)'}
                </span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pilih akun COA, lalu tentukan nominal pada kolom Debit atau Kredit (maksimal tidak boleh melebihi target jurnal).
              </p>
            </div>

            {/* Balancing & Settlement Status Badge */}
            <div className="flex items-center gap-2">
              {isBalanced ? (
                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold px-3 py-1 text-xs">
                  Seimbang (Balance)
                </Badge>
              ) : isPrimarySettled ? (
                <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 font-semibold px-3 py-1 text-xs">
                  {journalType === 'debit' ? 'Debet Terpenuhi (Kredit Belum Seimbang)' : 'Kredit Terpenuhi (Debet Belum Seimbang)'}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 font-semibold px-3 py-1 text-xs">
                  {journalType === 'debit' ? 'Debet Belum Lunas' : 'Kredit Belum Lunas'}
                </Badge>
              )}
            </div>
          </div>

          {/* Tabel Entri Data Pembayaran */}
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <Table className="w-full text-xs">
              <TableHeader className="bg-slate-50/90 border-b border-slate-200 text-slate-700">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 text-center font-bold">No</TableHead>
                  <TableHead className="min-w-[240px] font-bold">
                    Akun <RequiredMark />
                  </TableHead>
                  <TableHead className="min-w-[180px] text-right font-bold">
                    Debit (Nominal) {journalType === 'debit' && <span className="text-emerald-700 font-bold">*Wajib</span>}
                  </TableHead>
                  <TableHead className="min-w-[180px] text-right font-bold">
                    Kredit (Nominal) {journalType === 'credit' && <span className="text-rose-700 font-bold">*Wajib</span>}
                  </TableHead>
                  <TableHead className="min-w-[180px] font-bold">Catatan</TableHead>
                  <TableHead className="w-24 text-center font-bold sticky right-0 bg-slate-50">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paymentFields.map((fieldItem, pIndex) => {
                  const currentDebit = Number(watchedPayments?.[pIndex]?.debit || 0);
                  const currentCredit = Number(watchedPayments?.[pIndex]?.credit || 0);
                  const isDebitFilled = currentDebit > 0;
                  const isCreditFilled = currentCredit > 0;
                  const currentAccountId = Number(watchedPayments?.[pIndex]?.account_id || 0);

                  const maxDebit = getMaxDebitForRow(pIndex);
                  const maxCredit = getMaxCreditForRow(pIndex);

                  const isDebitDisabled =
                    isCreditFilled || isBusy || (targetAmount > 0 && maxDebit <= 0 && currentDebit <= 0);
                  const isCreditDisabled =
                    isDebitFilled || isBusy || (targetAmount > 0 && maxCredit <= 0 && currentCredit <= 0);

                  return (
                    <TableRow
                      key={fieldItem.id}
                      className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors"
                    >
                      {/* 1. Nomor Baris */}
                      <TableCell className="text-center font-medium text-slate-400">
                        {pIndex + 1}
                      </TableCell>

                      {/* 2. Pemilihan Akun (Searchable / Filtered & Disable Duplikat) */}
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`payments.${pIndex}.account_id`}
                          render={({ field }) => (
                            <Select
                              value={field.value ? String(field.value) : undefined}
                              onValueChange={(val) => field.onChange(Number(val))}
                              disabled={isBusy}
                            >
                              <SelectTrigger className="h-9 w-full bg-white text-xs border-slate-200">
                                <SelectValue placeholder="Pilih akun..." />
                              </SelectTrigger>
                              <SelectContent className="max-h-60" showSearch searchPlaceholder="Cari akun...">
                                {akunOptions.map((a) => {
                                  const isAlreadySelected =
                                    selectedAccountIds.has(Number(a.id)) && Number(a.id) !== currentAccountId;
                                  const rawType = a.type || '';
                                  const typeLabel =
                                    rawType.toLowerCase() === 'credit'
                                      ? 'Credit'
                                      : rawType.toLowerCase() === 'debet' || rawType.toLowerCase() === 'debit'
                                      ? 'Debit'
                                      : rawType || 'Debit';

                                  return (
                                    <SelectItem key={a.id} value={String(a.id)} disabled={isAlreadySelected}>
                                      <div className="flex items-center justify-between gap-2 w-full">
                                        <span className={cn(isAlreadySelected && 'text-slate-400 line-through')}>
                                          <span
                                            className={cn(
                                              'font-bold mr-1',
                                              typeLabel === 'Debit' ? 'text-blue-600' : 'text-purple-600',
                                            )}
                                          >
                                            [{typeLabel}]
                                          </span>
                                          {a.code} - {a.name}
                                        </span>
                                        {isAlreadySelected && (
                                          <span className="text-[10px] text-amber-600 font-medium">
                                            (Sudah dipilih)
                                          </span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </TableCell>

                      {/* 3. Debit (Nominal) - Terkunci jika Kredit terisi atau kuota debit habis */}
                      <TableCell className="text-right align-top">
                        <FormField
                          control={form.control}
                          name={`payments.${pIndex}.debit`}
                          render={({ field }) => (
                            <div className="flex flex-col items-end gap-1">
                              <MoneyInput
                                value={field.value || 0}
                                onChangeValue={(val) => {
                                  const clampedVal = targetAmount > 0 ? Math.min(val, maxDebit) : val;
                                  field.onChange(clampedVal);
                                  if (clampedVal > 0) {
                                    form.setValue(`payments.${pIndex}.credit`, 0, {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    });
                                  }
                                }}
                                currency="IDR"
                                disabled={isDebitDisabled}
                                placeholder={
                                  isCreditFilled
                                    ? 'Kredit aktif'
                                    : targetAmount > 0 && maxDebit <= 0
                                    ? 'Maksimal'
                                    : '0'
                                }
                                className={cn(
                                  'h-9 text-xs text-right font-semibold bg-white',
                                  isDebitDisabled
                                    ? 'text-slate-400 bg-slate-100 opacity-60 cursor-not-allowed'
                                    : 'text-emerald-700',
                                )}
                              />
                              {targetAmount > 0 && !isCreditFilled && maxDebit > 0 && maxDebit < targetAmount && (
                                <span className="text-[9px] text-slate-400">
                                  Maks: {currenciesFormat('idr', maxDebit)}
                                </span>
                              )}
                            </div>
                          )}
                        />
                      </TableCell>

                      {/* 4. Kredit (Nominal) - Terkunci jika Debit terisi atau kuota kredit habis */}
                      <TableCell className="text-right align-top">
                        <FormField
                          control={form.control}
                          name={`payments.${pIndex}.credit`}
                          render={({ field }) => (
                            <div className="flex flex-col items-end gap-1">
                              <MoneyInput
                                value={field.value || 0}
                                onChangeValue={(val) => {
                                  const clampedVal = targetAmount > 0 ? Math.min(val, maxCredit) : val;
                                  field.onChange(clampedVal);
                                  if (clampedVal > 0) {
                                    form.setValue(`payments.${pIndex}.debit`, 0, {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    });
                                  }
                                }}
                                currency="IDR"
                                disabled={isCreditDisabled}
                                placeholder={
                                  isDebitFilled
                                    ? 'Debit aktif'
                                    : targetAmount > 0 && maxCredit <= 0
                                    ? 'Maksimal'
                                    : '0'
                                }
                                className={cn(
                                  'h-9 text-xs text-right font-semibold bg-white',
                                  isCreditDisabled
                                    ? 'text-slate-400 bg-slate-100 opacity-60 cursor-not-allowed'
                                    : 'text-rose-700',
                                )}
                              />
                              {targetAmount > 0 && !isDebitFilled && maxCredit > 0 && maxCredit < targetAmount && (
                                <span className="text-[9px] text-slate-400">
                                  Maks: {currenciesFormat('idr', maxCredit)}
                                </span>
                              )}
                            </div>
                          )}
                        />
                      </TableCell>

                      {/* 5. Catatan */}
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`payments.${pIndex}.note`}
                          render={({ field }) => (
                            <Input
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="Catatan..."
                              className="h-9 text-xs bg-white"
                              disabled={isBusy}
                            />
                          )}
                        />
                      </TableCell>

                      {/* 6. Aksi: Copy Icon & Hapus Icon */}
                      <TableCell className="text-center sticky right-0 bg-white">
                        <div className="flex items-center justify-center gap-1">
                          {/* Tombol Copy (Salin baris) */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                            title="Salin baris ini (nominal dan catatan)"
                            disabled={isBusy || (journalType === 'debit' ? remainingDebit <= 0 : remainingCredit <= 0)}
                            onClick={() => handleCopyRow(pIndex)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>

                          {/* Tombol Hapus */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                            title={paymentFields.length <= 1 ? 'Kosongkan baris' : 'Hapus baris'}
                            disabled={isBusy}
                            onClick={() => handleDeleteRow(pIndex)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>

              {/* Table Footer: Totals & Balance indicator */}
              <TableFooter className="bg-slate-50/90 border-t-2 border-slate-300 font-semibold text-xs">
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={2} className="py-2.5 px-4 text-right uppercase tracking-wider text-slate-700 font-bold">
                    Total Jurnal IDR
                  </TableCell>
                  <TableCell className="py-2.5 px-4 text-right font-bold text-emerald-800 tabular-nums">
                    <div>{currenciesFormat('idr', totalDebit)}</div>
                    {targetAmount > 0 && totalDebit < targetAmount && (
                      <div className="text-[10px] text-amber-700 font-normal">
                        Sisa: {currenciesFormat('idr', remainingDebit)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 px-4 text-right font-bold text-rose-800 tabular-nums">
                    <div>{currenciesFormat('idr', totalCredit)}</div>
                    {targetAmount > 0 && totalCredit < targetAmount && (
                      <div className="text-[10px] text-amber-700 font-normal">
                        Sisa: {currenciesFormat('idr', remainingCredit)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell colSpan={2} className="py-2.5 px-4 text-center">
                    <span className="text-[11px] text-slate-600 font-medium">
                      Selisih: {currenciesFormat('idr', Math.abs(totalDebit - totalCredit))}
                    </span>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {/* Action Button Tambah Jurnal di Bawah Tabel (Disable jika Debit & Credit Full) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {isBothFull ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block w-full sm:w-auto">
                      <Button
                        type="button"
                        variant="outline"
                        disabled
                        className="w-full sm:w-auto text-slate-400 border-dashed border-slate-200 cursor-not-allowed text-xs"
                      >
                        <Plus className="mr-1.5 h-4 w-4" />
                        Tambah Jurnal
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Nominal debit dan kredit sudah penuh (maksimal tercapai).
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  appendPayment({
                    account_id: 0,
                    debit: 0,
                    credit: 0,
                    note: '',
                  });
                }}
                disabled={isBusy}
                className="w-full sm:w-auto text-slate-700 hover:text-slate-900 border-dashed border-slate-300 hover:border-slate-400 text-xs"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Tambah Jurnal
              </Button>
            )}
          </div>
        </div>
      </CollapsibleBox>

      {/* Footer Form Action Buttons */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isBusy}>
            Batal
          </Button>
        ) : null}

        {/* Tombol Simpan Jurnal (Draft: is_paid = false) */}
        <Button
          type="button"
          variant="outline"
          onClick={handleSaveDraft}
          disabled={isBusy}
          className="border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          {isBusy ? (
            <LoadingState variant="inline" text="Menyimpan..." />
          ) : (
            submitLabel
          )}
        </Button>

        {/* Tombol Tandai Lunas (Posting Lunas: is_paid = true) */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <Button
                  type="button"
                  onClick={handleMarkPaid}
                  disabled={isBusy || !isPaymentDataValid}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isBusy ? (
                    <LoadingState variant="inline" text="Menandai Lunas..." iconClassName="text-white" />
                  ) : (
                    <>
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      Tandai Lunas
                    </>
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            {!isPaymentDataValid && (
              <TooltipContent side="top" className="text-xs max-w-xs text-center">
                {targetAmount <= 0
                  ? 'Tentukan nominal jurnal umum terlebih dahulu.'
                  : !isPrimarySettled
                  ? `Pembayaran ${journalType === 'debit' ? 'debit' : 'kredit'} wajib lunas (${currenciesFormat('idr', targetAmount)}).`
                  : 'Lengkapi seluruh data akun dan nominal pada rincian pembayaran.'}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );

  if (!wrapWithForm) {
    return formContent;
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {formContent}
      </form>
    </Form>
  );
}
