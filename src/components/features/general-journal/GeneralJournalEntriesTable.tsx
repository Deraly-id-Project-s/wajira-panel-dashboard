import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Copy,
  Pencil,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Account } from '@/@types/account.types';
import type {
  GeneralJournal,
  GeneralJournalBillingPayment,
} from '@/@types/general-journal.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import RequiredMark from '@/components/ui/required-mark';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { useCreateGeneralJournalBillingPayment } from '@/hooks/useGeneralJournal';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { cn } from '@/lib/utils';

interface DraftPaymentRow {
  tempId: string;
  account_id: number;
  debit: number;
  credit: number;
  note: string;
}

interface Props {
  journal: GeneralJournal;
  payments: GeneralJournalBillingPayment[];
  billingId?: number;
  accounts?: Account[];
  isAccountsLoading?: boolean;
  isPaid: boolean;
  canEdit: boolean;
  isUsd: boolean;
  totalDebit?: number;
  totalCredit?: number;
  paidDebit?: number;
  paidCredit?: number;
  remainingDebit?: number;
  remainingCredit?: number;
  isDebitSettled?: boolean;
  isCreditSettled?: boolean;
  onAddPayment?: (defaultType?: 'debit' | 'credit') => void;
  onEditPayment: (payment: GeneralJournalBillingPayment) => void;
  onDeletePayment: (payment: GeneralJournalBillingPayment) => void;
}

export default function GeneralJournalEntriesTable({
  journal,
  payments,
  billingId,
  accounts = [],
  isAccountsLoading = false,
  isPaid,
  canEdit,
  isUsd,
  totalDebit = 0,
  totalCredit = 0,
  onEditPayment,
  onDeletePayment,
}: Props) {
  const currency = isUsd ? 'usd' : 'idr';

  const createPaymentMutation = useCreateGeneralJournalBillingPayment(journal.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tipe Jurnal dan Nominal Target
  const journalType = String(
    journal?.type ||
    (Number(journal?.total_credit || 0) > 0 && Number(journal?.total_debit || 0) === 0 ? 'credit' : '') ||
    'debit'
  ).toLowerCase();
  const isJournalCredit = journalType === 'credit' || journalType === 'kredit';

  const targetAmount = Number(
    journal?.amount ??
    journal?.total_amount ??
    (isJournalCredit ? journal?.total_credit ?? totalCredit : journal?.total_debit ?? totalDebit) ??
    0
  );

  // Mapped options akun COA dengan format [Debit/Credit] code - name
  const akunOptions = useMemo(() => {
    return (accounts || []).map((a) => {
      const rawType = a.type || '';
      const typeLabel =
        rawType.toLowerCase() === 'credit'
          ? 'Credit'
          : rawType.toLowerCase() === 'debet' || rawType.toLowerCase() === 'debit'
          ? 'Debit'
          : rawType || 'Debit';
      return {
        id: a.id,
        code: a.code,
        name: a.name,
        typeLabel,
      };
    });
  }, [accounts]);

  // Akumulasi nominal debit dan kredit yang tersimpan
  const savedDebitTotal = useMemo(() => {
    return payments
      .filter((p) => p.type === 'debit')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  const savedCreditTotal = useMemo(() => {
    return payments
      .filter((p) => p.type === 'credit')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  // Draft rows untuk entri pembayaran baru langsung pada tabel
  const createNewDraftRow = useCallback((): DraftPaymentRow => ({
    tempId: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    account_id: 0,
    debit: 0,
    credit: 0,
    note: '',
  }), []);

  const canAddMorePayments = canEdit && !(isPaid && Boolean(journal.is_balanced));
  const [draftRows, setDraftRows] = useState<DraftPaymentRow[]>([]);

  // Inisialisasi minimal 1 baris draft jika jurnal belum lunas & seimbang
  useEffect(() => {
    if (canAddMorePayments && draftRows.length === 0) {
      setDraftRows([createNewDraftRow()]);
    }
  }, [canAddMorePayments, draftRows.length, createNewDraftRow]);

  // Set ID akun yang telah dipilih (pada saved payments maupun draft rows)
  const selectedAccountIds = useMemo(() => {
    const set = new Set<number>();
    payments.forEach((p) => {
      if (p.account_id) set.add(Number(p.account_id));
    });
    draftRows.forEach((r) => {
      if (r.account_id) set.add(Number(r.account_id));
    });
    return set;
  }, [payments, draftRows]);

  // Total draft
  const draftDebitTotal = useMemo(() => {
    return draftRows.reduce((sum, r) => sum + Number(r.debit || 0), 0);
  }, [draftRows]);

  const draftCreditTotal = useMemo(() => {
    return draftRows.reduce((sum, r) => sum + Number(r.credit || 0), 0);
  }, [draftRows]);

  const totalDebitCombined = savedDebitTotal + draftDebitTotal;
  const totalCreditCombined = savedCreditTotal + draftCreditTotal;

  // Sisa kewajiban
  const remainingDebit = Math.max(0, targetAmount - totalDebitCombined);
  const remainingCredit = Math.max(0, targetAmount - totalCreditCombined);

  // Status settlement
  const isDebitSettled = targetAmount > 0 && totalDebitCombined >= targetAmount;
  const isCreditSettled = targetAmount > 0 && totalCreditCombined >= targetAmount;
  const isPrimarySettled = isJournalCredit ? isCreditSettled : isDebitSettled;
  const isBalanced = targetAmount > 0 && isDebitSettled && isCreditSettled;
  const isBothFull = targetAmount > 0 && totalDebitCombined >= targetAmount && totalCreditCombined >= targetAmount;

  // Batas maksimal debit/kredit per draft row
  const getMaxDebitForRow = useCallback(
    (tempId: string) => {
      if (targetAmount <= 0) return 0;
      const otherDraftDebits = draftRows
        .filter((r) => r.tempId !== tempId)
        .reduce((sum, r) => sum + Number(r.debit || 0), 0);
      return Math.max(0, targetAmount - (savedDebitTotal + otherDraftDebits));
    },
    [targetAmount, draftRows, savedDebitTotal]
  );

  const getMaxCreditForRow = useCallback(
    (tempId: string) => {
      if (targetAmount <= 0) return 0;
      const otherDraftCredits = draftRows
        .filter((r) => r.tempId !== tempId)
        .reduce((sum, r) => sum + Number(r.credit || 0), 0);
      return Math.max(0, targetAmount - (savedCreditTotal + otherDraftCredits));
    },
    [targetAmount, draftRows, savedCreditTotal]
  );

  // Draft row handlers
  const handleAddNewRow = () => {
    setDraftRows((prev) => [...prev, createNewDraftRow()]);
  };

  const handleDraftAccountChange = (tempId: string, accountId: number) => {
    setDraftRows((prev) =>
      prev.map((r) => (r.tempId === tempId ? { ...r, account_id: accountId } : r))
    );
  };

  const handleDraftDebitChange = (tempId: string, value: number) => {
    const maxDeb = getMaxDebitForRow(tempId);
    const clamped = targetAmount > 0 ? Math.min(value, maxDeb) : value;

    setDraftRows((prev) =>
      prev.map((r) =>
        r.tempId === tempId
          ? {
              ...r,
              debit: clamped,
              credit: clamped > 0 ? 0 : r.credit,
            }
          : r
      )
    );
  };

  const handleDraftCreditChange = (tempId: string, value: number) => {
    const maxCred = getMaxCreditForRow(tempId);
    const clamped = targetAmount > 0 ? Math.min(value, maxCred) : value;

    setDraftRows((prev) =>
      prev.map((r) =>
        r.tempId === tempId
          ? {
              ...r,
              credit: clamped,
              debit: clamped > 0 ? 0 : r.debit,
            }
          : r
      )
    );
  };

  const handleDraftNoteChange = (tempId: string, note: string) => {
    setDraftRows((prev) =>
      prev.map((r) => (r.tempId === tempId ? { ...r, note } : r))
    );
  };

  const handleCopyDraftRow = (tempId: string) => {
    const targetRow = draftRows.find((r) => r.tempId === tempId);
    if (!targetRow) return;

    const availableDebit = targetAmount > 0 ? Math.max(0, targetAmount - totalDebitCombined) : targetRow.debit;
    const availableCredit = targetAmount > 0 ? Math.max(0, targetAmount - totalCreditCombined) : targetRow.credit;

    setDraftRows((prev) => [
      ...prev,
      {
        tempId: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        account_id: 0,
        debit: targetRow.debit > 0 ? Math.min(targetRow.debit, availableDebit) : 0,
        credit: targetRow.credit > 0 ? Math.min(targetRow.credit, availableCredit) : 0,
        note: targetRow.note || '',
      },
    ]);
    toast.info('Baris pembayaran berhasil disalin. Silakan pilih akun COA untuk baris baru.');
  };

  const handleDeleteDraftRow = (tempId: string) => {
    if (draftRows.length <= 1) {
      setDraftRows([createNewDraftRow()]);
      toast.info('Baris pembayaran telah dikosongkan');
    } else {
      setDraftRows((prev) => prev.filter((r) => r.tempId !== tempId));
    }
  };

  // Mass save draft payments
  const targetBillingId = billingId || journal?.billings?.[0]?.id;

  const handleSaveDraftPayments = async () => {
    if (!targetBillingId) {
      toast.error('Billing ID tidak ditemukan untuk menyimpan pembayaran');
      return;
    }

    const filledRows = draftRows.filter((r) => r.account_id > 0 && (r.debit > 0 || r.credit > 0));
    if (filledRows.length === 0) {
      toast.error('Silakan pilih akun dan isi nominal debit atau kredit terlebih dahulu');
      return;
    }

    for (let i = 0; i < filledRows.length; i++) {
      const row = filledRows[i];
      const rowNum = i + 1;
      if (!row.account_id) {
        toast.error(`Akun belum dipilih pada baris ke-${rowNum}`);
        return;
      }
      if (row.debit <= 0 && row.credit <= 0) {
        toast.error(`Nominal debit atau kredit harus lebih dari 0 pada baris ke-${rowNum}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      for (const row of filledRows) {
        const isDeb = row.debit > 0;
        const amt = isDeb ? row.debit : row.credit;
        const pType: 'debit' | 'credit' = isDeb ? 'debit' : 'credit';

        await createPaymentMutation.mutateAsync({
          general_journal_billing_id: targetBillingId,
          account_id: row.account_id,
          type: pType,
          amount: amt,
          amount_original: isUsd ? amt : 0,
          note: row.note || null,
        });
      }

      toast.success(`Berhasil menyimpan ${filledRows.length} entri pembayaran jurnal`);
      setDraftRows([createNewDraftRow()]);
    } catch (error) {
      toast.error(getApiErrorMessage(error) || 'Gagal menyimpan pembayaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasFilledDraft = draftRows.some((r) => r.account_id > 0 && (r.debit > 0 || r.credit > 0));

  return (
    <CollapsibleBox
      title="Rincian Pembayaran Jurnal"
      description="Entri pembayaran debit dan kredit jurnal umum (maksimal dibatasi nominal target jurnal, posisi utama wajib lunas)."
      icon={CreditCard}
      defaultExpanded={true}
    >
      <div className="space-y-4">
        {/* Header Info / Status Keseimbangan (Persis seperti pada form) */}
        <div className="flex flex-col items-stretch gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-slate-600 font-medium">
              Target Nominal: <span className="font-bold text-slate-900">{currenciesFormat(currency, targetAmount)}</span>
              {' '}&bull; Posisi Utama:{' '}
              <span className={cn('font-bold', isJournalCredit ? 'text-rose-700' : 'text-emerald-700')}>
                {isJournalCredit ? 'Kredit (Wajib Lunas)' : 'Debet (Wajib Lunas)'}
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
                {isJournalCredit ? 'Kredit Terpenuhi (Debet Belum Seimbang)' : 'Debet Terpenuhi (Kredit Belum Seimbang)'}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 font-semibold px-3 py-1 text-xs">
                {isJournalCredit ? 'Kredit Belum Lunas' : 'Debet Belum Lunas'}
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
                  Debit (Nominal) {!isJournalCredit && <span className="text-emerald-700 font-bold">*Wajib</span>}
                </TableHead>
                <TableHead className="min-w-[180px] text-right font-bold">
                  Kredit (Nominal) {isJournalCredit && <span className="text-rose-700 font-bold">*Wajib</span>}
                </TableHead>
              <TableHead className="min-w-[180px] font-bold">Catatan</TableHead>
              <TableHead className="w-24 text-center font-bold sticky right-0 bg-slate-50">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* 1. Saved Payments */}
            {payments.map((p, idx) => {
              const isDebit = p.type === 'debit';
              const isCredit = p.type === 'credit';
              const isLocked = isDebit ? isPaid : (isPaid && isBalanced);
              const canModify = !isLocked && canEdit;
              const acc = p.account;
              const rawType = acc?.type || '';
              const typeLabel = rawType.toLowerCase() === 'credit' ? 'Credit' : 'Debit';

              return (
                <TableRow key={p.id ?? idx} className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors">
                  <TableCell className="text-center font-medium text-slate-400">
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-slate-900">
                        <span className={cn('font-bold mr-1', isDebit ? 'text-blue-600' : 'text-purple-600')}>
                          [{typeLabel}]
                        </span>
                        {acc?.code} - {acc?.name}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.2 rounded font-semibold',
                            isDebit
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          )}
                        >
                          {isDebit ? 'Debet' : 'Kredit'}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {isDebit ? (
                      <div className="flex flex-col items-end">
                        <span className="font-semibold tabular-nums text-emerald-700">
                          {currenciesFormat(currency, p.amount)}
                        </span>
                        {isUsd && Number(p.amount_original || 0) > 0 && (
                          <span className="text-[10px] text-slate-500 tabular-nums">
                            Konversi IDR: {currenciesFormat('idr', p.amount_original)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 font-bold">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isCredit ? (
                      <div className="flex flex-col items-end">
                        <span className="font-semibold tabular-nums text-rose-700">
                          {currenciesFormat(currency, p.amount)}
                        </span>
                        {isUsd && Number(p.amount_original || 0) > 0 && (
                          <span className="text-[10px] text-slate-500 tabular-nums">
                            Konversi IDR: {currenciesFormat('idr', p.amount_original)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 font-bold">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600 max-w-[200px] truncate">
                    {p.note || '-'}
                  </TableCell>
                  <TableCell className="text-center sticky right-0 bg-white">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={!canModify}
                        onClick={() => onEditPayment(p)}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-40"
                        title="Edit pembayaran"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={!canModify}
                        onClick={() => onDeletePayment(p)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md disabled:opacity-40"
                        title="Hapus pembayaran"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {/* 2. Draft Rows (Gaya & Cara Menambah Data Persis Seperti Form) */}
            {canAddMorePayments &&
              draftRows.map((row, draftIdx) => {
                const currentDebit = Number(row.debit || 0);
                const currentCredit = Number(row.credit || 0);
                const isDebitFilled = currentDebit > 0;
                const isCreditFilled = currentCredit > 0;

                const maxDebit = getMaxDebitForRow(row.tempId);
                const maxCredit = getMaxCreditForRow(row.tempId);

                const isDebitDisabled =
                  isCreditFilled || !canEdit || isSubmitting || (targetAmount > 0 && maxDebit <= 0 && currentDebit <= 0);
                const isCreditDisabled =
                  isDebitFilled || !canEdit || isSubmitting || (targetAmount > 0 && maxCredit <= 0 && currentCredit <= 0);

                return (
                  <TableRow
                    key={row.tempId}
                    className="bg-blue-50/30 hover:bg-blue-50/50 border-b border-blue-100 transition-colors"
                  >
                    {/* Nomor Baris Draft */}
                    <TableCell className="text-center font-bold text-blue-900">
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-blue-100 text-[10px]">
                        +{payments.length + draftIdx + 1}
                      </span>
                    </TableCell>

                    {/* Akun COA Select */}
                    <TableCell>
                      <Select
                        value={row.account_id ? String(row.account_id) : undefined}
                        onValueChange={(val) => handleDraftAccountChange(row.tempId, Number(val))}
                        disabled={!canEdit || isSubmitting || isAccountsLoading}
                      >
                        <SelectTrigger className="h-9 w-full bg-white text-xs border-slate-200">
                          <SelectValue placeholder="Pilih akun..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60" showSearch searchPlaceholder="Cari akun...">
                          {akunOptions.map((a) => {
                            const isAlreadySelected =
                              selectedAccountIds.has(Number(a.id)) && Number(a.id) !== row.account_id;

                            return (
                              <SelectItem key={a.id} value={String(a.id)} disabled={isAlreadySelected}>
                                <div className="flex items-center justify-between gap-2 w-full">
                                  <span className={cn(isAlreadySelected && 'text-slate-400 line-through')}>
                                    <span
                                      className={cn(
                                        'font-bold mr-1',
                                        a.typeLabel === 'Debit' ? 'text-blue-600' : 'text-purple-600'
                                      )}
                                    >
                                      [{a.typeLabel}]
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
                    </TableCell>

                    {/* Debit (Nominal) */}
                    <TableCell className="text-right align-top">
                      <div className="flex flex-col items-end gap-1">
                        <MoneyInput
                          value={row.debit || 0}
                          onChangeValue={(val) => handleDraftDebitChange(row.tempId, val)}
                          currency={currency.toUpperCase()}
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
                              : 'text-emerald-700'
                          )}
                        />
                        {targetAmount > 0 && !isCreditFilled && maxDebit > 0 && maxDebit < targetAmount && (
                          <span className="text-[9px] text-slate-400">
                            Maks: {currenciesFormat(currency, maxDebit)}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Kredit (Nominal) */}
                    <TableCell className="text-right align-top">
                      <div className="flex flex-col items-end gap-1">
                        <MoneyInput
                          value={row.credit || 0}
                          onChangeValue={(val) => handleDraftCreditChange(row.tempId, val)}
                          currency={currency.toUpperCase()}
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
                              : 'text-rose-700'
                          )}
                        />
                        {targetAmount > 0 && !isDebitFilled && maxCredit > 0 && maxCredit < targetAmount && (
                          <span className="text-[9px] text-slate-400">
                            Maks: {currenciesFormat(currency, maxCredit)}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Catatan */}
                    <TableCell>
                      <Input
                        value={row.note || ''}
                        onChange={(e) => handleDraftNoteChange(row.tempId, e.target.value)}
                        placeholder="Catatan..."
                        className="h-9 text-xs bg-white"
                        disabled={!canEdit || isSubmitting}
                      />
                    </TableCell>

                    {/* Aksi Draft: Copy & Delete */}
                    <TableCell className="text-center sticky right-0 bg-blue-50/50">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                          title="Salin baris ini (nominal dan catatan)"
                          disabled={isBothFull || !canEdit || isSubmitting}
                          onClick={() => handleCopyDraftRow(row.tempId)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          title={draftRows.length <= 1 ? 'Kosongkan baris' : 'Hapus baris draft'}
                          disabled={!canEdit || isSubmitting}
                          onClick={() => handleDeleteDraftRow(row.tempId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>

          {/* Table Footer: Totals & Balance indicator (Persis seperti pada form) */}
          <TableFooter className="bg-slate-50/90 border-t-2 border-slate-300 font-semibold text-xs">
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={2} className="py-2.5 px-4 text-right uppercase tracking-wider text-slate-700 font-bold">
                Total Jurnal {isUsd ? 'USD' : 'IDR'}
              </TableCell>
              <TableCell className="py-2.5 px-4 text-right font-bold text-emerald-800 tabular-nums">
                <div>{currenciesFormat(currency, totalDebitCombined)}</div>
                {targetAmount > 0 && totalDebitCombined < targetAmount && (
                  <div className="text-[10px] text-amber-700 font-normal">
                    Sisa: {currenciesFormat(currency, remainingDebit)}
                  </div>
                )}
              </TableCell>
              <TableCell className="py-2.5 px-4 text-right font-bold text-rose-800 tabular-nums">
                <div>{currenciesFormat(currency, totalCreditCombined)}</div>
                {targetAmount > 0 && totalCreditCombined < targetAmount && (
                  <div className="text-[10px] text-amber-700 font-normal">
                    Sisa: {currenciesFormat(currency, remainingCredit)}
                  </div>
                )}
              </TableCell>
              <TableCell colSpan={2} className="py-2.5 px-4 text-center">
                <span className="text-[11px] text-slate-600 font-medium">
                  Selisih: {currenciesFormat(currency, Math.abs(totalDebitCombined - totalCreditCombined))}
                </span>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Action Buttons di Bawah Tabel (Persis seperti form & FinanceBillingTable) */}
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
            disabled={!canAddMorePayments}
            onClick={handleAddNewRow}
            className="w-full sm:w-auto text-slate-700 hover:text-slate-900 border-dashed border-slate-300 hover:border-slate-400 text-xs"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Tambah Jurnal
          </Button>
        )}

        {canAddMorePayments && hasFilledDraft && (
          <Button
            type="button"
            onClick={() => void handleSaveDraftPayments()}
            disabled={!canEdit || isSubmitting}
            loading={isSubmitting}
            className="w-full sm:w-auto btn-primary-orange text-xs h-9 px-4"
          >
            <Check className="mr-1.5 h-4 w-4" />
            Simpan Pembayaran
          </Button>
        )}
      </div>
    </div>
  </CollapsibleBox>
);
}