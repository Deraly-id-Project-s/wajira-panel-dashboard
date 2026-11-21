'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { Plus, Info, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { InputDate } from '@/components/ui/input-date';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReferenceLink } from '@/components/ui/reference-link';
import { useCreateFinanceBilling, useDeleteFinanceBilling } from '@/hooks/useFinanceBilling';
import { useKas } from '@/hooks/useKas';
import { useAccounts } from '@/hooks/useAccount';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { getTodayWIB } from '@/lib/utils/date';
import type { FinanceBilling, FinanceBillingPayload } from '@/@types/finance-billing.types';
import type { KasHarian } from '@/@types/kas-harian.types';
import { LoadingState } from '@/components/ui/loading-state';
import { cn } from '@/lib/utils';

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const isUsdKas = (kas?: { currency_type?: string | null; code?: string | null } | null) => {
  if (!kas) return false;
  if ((kas.currency_type || '').toLowerCase() === 'usd') return true;
  return (kas.code || '').toLowerCase().includes('usd');
};

interface DraftBillingRow {
  tempId: string;
  payment_at: string;
  account_id: number;
  cash_id: number;
  debit: number;
  credit: number;
  amount_original: number;
  note: string;
}

interface Props {
  financeBillings: FinanceBilling[];
  cashFlowDetail: KasHarian;
  companyId: number;
  disabled?: boolean;
}

export default function FinanceBillingTable({ financeBillings, cashFlowDetail, companyId, disabled = false }: Props) {
  const router = useRouter();
  const { slug } = router.query;
  const slugStr = typeof slug === 'string' ? slug : '';

  const createMutation = useCreateFinanceBilling();
  const deleteMutation = useDeleteFinanceBilling();

  const kasQuery = useKas(companyId > 0 ? companyId : undefined);
  const accountQuery = useAccounts({
    page: 1,
    perPage: 1000,
    search: '',
    company_id: companyId > 0 ? companyId : undefined,
    enabled: companyId > 0,
  });

  const kasOptions = useMemo(() => kasQuery.data?.data ?? [], [kasQuery.data?.data]);
  const akunOptions = useMemo(() => accountQuery.data?.data ?? [], [accountQuery.data?.data]);

  // Direction of the Cash Flow: debet (uang masuk) vs credit (uang keluar)
  const cashFlowDirection = useMemo<'debet' | 'credit'>(() => {
    if (cashFlowDetail.cash_flow_type === 'credit') return 'credit';
    if (cashFlowDetail.cash_flow_type === 'debet' || cashFlowDetail.cash_flow_type === 'debit') return 'debet';
    if (Number(cashFlowDetail.credit_total || cashFlowDetail.credit || cashFlowDetail.cash_position?.credit_idr_total || 0) > 0) return 'credit';
    return 'debet';
  }, [cashFlowDetail]);

  // --- IDR Totals from cash flow ---
  const idrCashesDebet = useMemo(() => {
    return (cashFlowDetail.cash_flow_cashes ?? [])
      .filter((c) => !isUsdKas(c.cash) && (c.type === 'debet' || c.type === 'debit'))
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);
  }, [cashFlowDetail.cash_flow_cashes]);

  const idrCashesCredit = useMemo(() => {
    return (cashFlowDetail.cash_flow_cashes ?? [])
      .filter((c) => !isUsdKas(c.cash) && c.type === 'credit')
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);
  }, [cashFlowDetail.cash_flow_cashes]);

  const debetIdrTotal = Math.max(
    Number(cashFlowDetail.debet_total || 0),
    Number(cashFlowDetail.cash_position?.debet_idr_total || 0),
    Number(cashFlowDetail.debet || 0),
    idrCashesDebet,
  );

  const creditIdrTotal = Math.max(
    Number(cashFlowDetail.credit_total || 0),
    Number(cashFlowDetail.cash_position?.credit_idr_total || 0),
    Number(cashFlowDetail.credit || 0),
    idrCashesCredit,
  );

  const fallbackGrandTotal = Number(
    cashFlowDetail.grand_total ||
    cashFlowDetail.unit_transaction_billing?.grand_total ||
    cashFlowDetail.goods_transaction_billing?.grand_total ||
    cashFlowDetail.amount ||
    0,
  );

  const targetTotalIdr = useMemo(() => {
    const val = Math.max(
      fallbackGrandTotal,
      cashFlowDirection === 'debet' ? debetIdrTotal : creditIdrTotal,
      debetIdrTotal,
      creditIdrTotal,
    );
    return val > 0 ? val : 0;
  }, [fallbackGrandTotal, cashFlowDirection, debetIdrTotal, creditIdrTotal]);

  // --- USD Totals from cash flow ---
  const usdCashesDebet = useMemo(() => {
    return (cashFlowDetail.cash_flow_cashes ?? [])
      .filter((c) => isUsdKas(c.cash) && (c.type === 'debet' || c.type === 'debit'))
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);
  }, [cashFlowDetail.cash_flow_cashes]);

  const usdCashesCredit = useMemo(() => {
    return (cashFlowDetail.cash_flow_cashes ?? [])
      .filter((c) => isUsdKas(c.cash) && c.type === 'credit')
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);
  }, [cashFlowDetail.cash_flow_cashes]);

  const debetUsdTotal = Math.max(
    Number(cashFlowDetail.debet_usd_total || 0),
    Number(cashFlowDetail.cash_position?.debet_usd_total || 0),
    Number(cashFlowDetail.debet_usd || 0),
    usdCashesDebet,
  );

  const creditUsdTotal = Math.max(
    Number(cashFlowDetail.credit_usd_total || 0),
    Number(cashFlowDetail.cash_position?.credit_usd_total || 0),
    Number(cashFlowDetail.credit_usd || 0),
    usdCashesCredit,
  );

  const fallbackGrandTotalUsd = Number(cashFlowDetail.grand_total_usd || 0);
  const usdCostsTotal = (cashFlowDetail.unit_transaction_billing?.unit_transaction?.unit_transaction_usd_costs ?? []).reduce(
    (sum, c) => sum + Number(c.amount || 0),
    0,
  );

  const targetTotalUsd = useMemo(() => {
    const val = Math.max(
      cashFlowDirection === 'debet' ? debetUsdTotal : creditUsdTotal,
      debetUsdTotal,
      creditUsdTotal,
      fallbackGrandTotalUsd,
      usdCostsTotal,
      Number(cashFlowDetail.remaining_payment_usd || 0),
      Number(cashFlowDetail.dual_remaining_payment_usd || 0),
    );
    return val > 0 ? val : 0;
  }, [
    cashFlowDirection,
    debetUsdTotal,
    creditUsdTotal,
    fallbackGrandTotalUsd,
    usdCostsTotal,
    cashFlowDetail.remaining_payment_usd,
    cashFlowDetail.dual_remaining_payment_usd,
  ]);

  // Helper to determine if a saved billing is Debit or Credit
  const isFbCredit = useCallback((fb: FinanceBilling) => {
    const rawType = (fb.type || (fb as any).type || (fb as any).direction || '').toLowerCase().trim();
    if (rawType === 'credit') {
      return true;
    }
    if (rawType === 'debet' || rawType === 'debit') {
      return false;
    }
    const acc = akunOptions.find((a) => Number(a.id) === Number(fb.account_id));
    const accType = (fb.account?.type || acc?.type || '').toLowerCase().trim();
    if (accType === 'credit') {
      return true;
    }
    return false;
  }, [akunOptions]);

  const isFbDebit = useCallback((fb: FinanceBilling) => {
    return !isFbCredit(fb);
  }, [isFbCredit]);

  // --- Saved Totals Separated by Currency ---
  const savedDebitIdrTotal = useMemo(() => {
    return financeBillings
      .filter((fb) => !isUsdKas(fb.cash) && isFbDebit(fb))
      .reduce((sum, fb) => sum + Number(fb.amount || 0), 0);
  }, [financeBillings, isFbDebit]);

  const savedCreditIdrTotal = useMemo(() => {
    return financeBillings
      .filter((fb) => !isUsdKas(fb.cash) && isFbCredit(fb))
      .reduce((sum, fb) => sum + Number(fb.amount || 0), 0);
  }, [financeBillings, isFbCredit]);

  const savedDebitUsdTotal = useMemo(() => {
    return financeBillings
      .filter((fb) => isUsdKas(fb.cash) && isFbDebit(fb))
      .reduce((sum, fb) => sum + Number(fb.amount || 0), 0);
  }, [financeBillings, isFbDebit]);

  const savedCreditUsdTotal = useMemo(() => {
    return financeBillings
      .filter((fb) => isUsdKas(fb.cash) && isFbCredit(fb))
      .reduce((sum, fb) => sum + Number(fb.amount || 0), 0);
  }, [financeBillings, isFbCredit]);

  // Function to create a clean draft row with default values
  const createNewDraftRow = useCallback((): DraftBillingRow => {
    let defaultCashId = 0;
    const isIdrSettled = targetTotalIdr > 0 && savedDebitIdrTotal >= targetTotalIdr && savedCreditIdrTotal >= targetTotalIdr;
    const isUsdAvailable = targetTotalUsd > 0 && (savedDebitUsdTotal < targetTotalUsd || savedCreditUsdTotal < targetTotalUsd);

    const usdKas = kasOptions.find((k) => isUsdKas(k));
    const idrKas = kasOptions.find((k) => !isUsdKas(k));

    if (isIdrSettled && isUsdAvailable && usdKas) {
      defaultCashId = Number(usdKas.id);
    } else if (idrKas) {
      defaultCashId = Number(idrKas.id);
    } else if (kasOptions[0]) {
      defaultCashId = Number(kasOptions[0].id);
    }

    return {
      tempId: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      payment_at: format(getTodayWIB(), 'yyyy-MM-dd'),
      account_id: 0,
      cash_id: defaultCashId,
      debit: 0,
      credit: 0,
      amount_original: 0,
      note: '',
    };
  }, [kasOptions, targetTotalIdr, targetTotalUsd, savedDebitIdrTotal, savedCreditIdrTotal, savedDebitUsdTotal, savedCreditUsdTotal]);

  // Draft rows for inline entry (default 1 row, never empty)
  const [draftRows, setDraftRows] = useState<DraftBillingRow[]>([]);
  const [isSubmittingMass, setIsSubmittingMass] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FinanceBilling | null>(null);

  // Initialize with at least 1 draft row by default
  useEffect(() => {
    if (draftRows.length === 0) {
      setDraftRows([createNewDraftRow()]);
    }
  }, [draftRows.length, createNewDraftRow]);

  // Update default cash_id if kasOptions finish loading and draft cash_id is 0
  useEffect(() => {
    if (kasOptions.length > 0) {
      const isIdrSettled = targetTotalIdr > 0 && savedDebitIdrTotal >= targetTotalIdr && savedCreditIdrTotal >= targetTotalIdr;
      const isUsdAvailable = targetTotalUsd > 0 && (savedDebitUsdTotal < targetTotalUsd || savedCreditUsdTotal < targetTotalUsd);
      const usdKas = kasOptions.find((k) => isUsdKas(k));
      const idrKas = kasOptions.find((k) => !isUsdKas(k));

      const defaultCash = (isIdrSettled && isUsdAvailable && usdKas) ? usdKas : (idrKas || kasOptions[0]);
      if (defaultCash) {
        setDraftRows((prev) =>
          prev.map((r) => (r.cash_id === 0 ? { ...r, cash_id: Number(defaultCash.id) } : r))
        );
      }
    }
  }, [kasOptions, targetTotalIdr, targetTotalUsd, savedDebitIdrTotal, savedCreditIdrTotal, savedDebitUsdTotal, savedCreditUsdTotal]);

  // Set of account IDs that have been selected in saved billings or draft rows
  const selectedAccountIds = useMemo(() => {
    const set = new Set<number>();
    financeBillings.forEach((fb) => {
      if (fb.account_id) set.add(Number(fb.account_id));
    });
    draftRows.forEach((r) => {
      if (r.account_id) set.add(Number(r.account_id));
    });
    return set;
  }, [financeBillings, draftRows]);

  // --- Draft Totals Separated by Currency ---
  const draftDebitIdrTotal = useMemo(() => {
    return draftRows
      .filter((r) => {
        const kas = kasOptions.find((k) => Number(k.id) === Number(r.cash_id));
        return !isUsdKas(kas);
      })
      .reduce((sum, r) => sum + Number(r.debit || 0), 0);
  }, [draftRows, kasOptions]);

  const draftCreditIdrTotal = useMemo(() => {
    return draftRows
      .filter((r) => {
        const kas = kasOptions.find((k) => Number(k.id) === Number(r.cash_id));
        return !isUsdKas(kas);
      })
      .reduce((sum, r) => sum + Number(r.credit || 0), 0);
  }, [draftRows, kasOptions]);

  const draftDebitUsdTotal = useMemo(() => {
    return draftRows
      .filter((r) => {
        const kas = kasOptions.find((k) => Number(k.id) === Number(r.cash_id));
        return isUsdKas(kas);
      })
      .reduce((sum, r) => sum + Number(r.debit || 0), 0);
  }, [draftRows, kasOptions]);

  const draftCreditUsdTotal = useMemo(() => {
    return draftRows
      .filter((r) => {
        const kas = kasOptions.find((k) => Number(k.id) === Number(r.cash_id));
        return isUsdKas(kas);
      })
      .reduce((sum, r) => sum + Number(r.credit || 0), 0);
  }, [draftRows, kasOptions]);

  // Combined totals (Saved + Draft)
  const totalDebitIdrCombined = savedDebitIdrTotal + draftDebitIdrTotal;
  const totalCreditIdrCombined = savedCreditIdrTotal + draftCreditIdrTotal;
  const totalDebitUsdCombined = savedDebitUsdTotal + draftDebitUsdTotal;
  const totalCreditUsdCombined = savedCreditUsdTotal + draftCreditUsdTotal;

  // Max calculations per row, strictly checking whether the row uses USD Kas or IDR Kas
  const getMaxDebitForRow = useCallback(
    (tempId: string) => {
      const row = draftRows.find((r) => r.tempId === tempId);
      const kas = kasOptions.find((k) => Number(k.id) === Number(row?.cash_id));
      const isUsd = isUsdKas(kas);

      if (isUsd) {
        if (targetTotalUsd <= 0) return 999999999;
        const otherDraftDebitsUsd = draftRows
          .filter((r) => r.tempId !== tempId && isUsdKas(kasOptions.find((k) => Number(k.id) === Number(r.cash_id))))
          .reduce((sum, r) => sum + Number(r.debit || 0), 0);
        return Math.max(0, targetTotalUsd - (savedDebitUsdTotal + otherDraftDebitsUsd));
      } else {
        if (targetTotalIdr <= 0) return 999999999;
        const otherDraftDebitsIdr = draftRows
          .filter((r) => r.tempId !== tempId && !isUsdKas(kasOptions.find((k) => Number(k.id) === Number(r.cash_id))))
          .reduce((sum, r) => sum + Number(r.debit || 0), 0);
        return Math.max(0, targetTotalIdr - (savedDebitIdrTotal + otherDraftDebitsIdr));
      }
    },
    [draftRows, kasOptions, targetTotalUsd, targetTotalIdr, savedDebitUsdTotal, savedDebitIdrTotal]
  );

  const getMaxCreditForRow = useCallback(
    (tempId: string) => {
      const row = draftRows.find((r) => r.tempId === tempId);
      const kas = kasOptions.find((k) => Number(k.id) === Number(row?.cash_id));
      const isUsd = isUsdKas(kas);

      if (isUsd) {
        if (targetTotalUsd <= 0) return 999999999;
        const otherDraftCreditsUsd = draftRows
          .filter((r) => r.tempId !== tempId && isUsdKas(kasOptions.find((k) => Number(k.id) === Number(r.cash_id))))
          .reduce((sum, r) => sum + Number(r.credit || 0), 0);
        return Math.max(0, targetTotalUsd - (savedCreditUsdTotal + otherDraftCreditsUsd));
      } else {
        if (targetTotalIdr <= 0) return 999999999;
        const otherDraftCreditsIdr = draftRows
          .filter((r) => r.tempId !== tempId && !isUsdKas(kasOptions.find((k) => Number(k.id) === Number(r.cash_id))))
          .reduce((sum, r) => sum + Number(r.credit || 0), 0);
        return Math.max(0, targetTotalIdr - (savedCreditIdrTotal + otherDraftCreditsIdr));
      }
    },
    [draftRows, kasOptions, targetTotalUsd, targetTotalIdr, savedCreditUsdTotal, savedCreditIdrTotal]
  );

  // Add new draft row
  const handleAddNewRow = () => {
    setDraftRows((prev) => [...prev, createNewDraftRow()]);
  };

  // Remove or reset draft row
  const handleRemoveDraftRow = (tempId: string) => {
    if (draftRows.length <= 1) {
      setDraftRows([createNewDraftRow()]);
      toast.info('Baris jurnal dikosongkan (minimal harus ada 1 baris entri)');
      return;
    }
    setDraftRows((prev) => prev.filter((r) => r.tempId !== tempId));
  };

  // Field change handlers
  const handleDraftAccountChange = (tempId: string, nextAccountId: number) => {
    setDraftRows((prev) =>
      prev.map((row) => (row.tempId === tempId ? { ...row, account_id: nextAccountId } : row))
    );
  };

  const handleDraftCashChange = (tempId: string, nextCashId: number) => {
    const nextKas = kasOptions.find((k) => Number(k.id) === nextCashId);
    const nextIsUsd = isUsdKas(nextKas);

    setDraftRows((prev) =>
      prev.map((row) => {
        if (row.tempId !== tempId) return row;
        const prevKas = kasOptions.find((k) => Number(k.id) === Number(row.cash_id));
        const prevIsUsd = isUsdKas(prevKas);

        let nextDebit = row.debit;
        let nextCredit = row.credit;
        let nextAmountOriginal = row.amount_original;

        // Reset nominals if switching between IDR and USD to prevent currency scale mismatch
        if (prevIsUsd !== nextIsUsd) {
          nextDebit = 0;
          nextCredit = 0;
          nextAmountOriginal = 0;
        }

        return {
          ...row,
          cash_id: nextCashId,
          debit: nextDebit,
          credit: nextCredit,
          amount_original: nextAmountOriginal,
        };
      })
    );
  };

  const handleDraftDebitChange = (tempId: string, value: number) => {
    const maxDebit = getMaxDebitForRow(tempId);
    if (maxDebit <= 0) {
      toast.warning('Nominal debit sudah mencapai batas maksimal transaksi.');
      setDraftRows((prev) =>
        prev.map((row) => (row.tempId === tempId ? { ...row, debit: 0 } : row))
      );
      return;
    }
    const clamped = Math.min(value, maxDebit);

    setDraftRows((prev) =>
      prev.map((row) => {
        if (row.tempId !== tempId) return row;
        return {
          ...row,
          debit: clamped,
          credit: clamped > 0 ? 0 : row.credit, // entering debit clears credit
        };
      })
    );
  };

  const handleDraftCreditChange = (tempId: string, value: number) => {
    const maxCredit = getMaxCreditForRow(tempId);
    if (maxCredit <= 0) {
      toast.warning('Nominal kredit sudah mencapai batas maksimal transaksi.');
      setDraftRows((prev) =>
        prev.map((row) => (row.tempId === tempId ? { ...row, credit: 0 } : row))
      );
      return;
    }
    const clamped = Math.min(value, maxCredit);

    setDraftRows((prev) =>
      prev.map((row) => {
        if (row.tempId !== tempId) return row;
        return {
          ...row,
          credit: clamped,
          debit: clamped > 0 ? 0 : row.debit, // entering credit clears debit
        };
      })
    );
  };

  const handleDraftFieldChange = (tempId: string, field: 'payment_at' | 'note' | 'amount_original', value: any) => {
    setDraftRows((prev) =>
      prev.map((row) => (row.tempId === tempId ? { ...row, [field]: value } : row))
    );
  };

  // Mass Save handler
  const handleMassSave = async () => {
    const filledRows = draftRows.filter((r) => r.account_id > 0 || r.debit > 0 || r.credit > 0);

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
      if (!row.cash_id) {
        toast.error(`Kas belum dipilih pada baris ke-${rowNum}`);
        return;
      }
      if (row.debit <= 0 && row.credit <= 0) {
        toast.error(`Nominal debit atau kredit harus lebih dari 0 pada baris ke-${rowNum}`);
        return;
      }
      const kas = kasOptions.find((k) => Number(k.id) === Number(row.cash_id));
      if (isUsdKas(kas) && Number(row.amount_original || 0) <= 0) {
        toast.error(`Nominal konversi IDR (kurs) wajib ditentukan manual untuk kas USD pada baris ke-${rowNum}`);
        return;
      }
      if (!row.payment_at) {
        toast.error(`Tanggal bayar wajib diisi pada baris ke-${rowNum}`);
        return;
      }
    }

    // Validation against max totals IDR
    if (targetTotalIdr > 0) {
      if (totalDebitIdrCombined > targetTotalIdr) {
        toast.error(
          `Total debit IDR (${currenciesFormat('idr', totalDebitIdrCombined)}) melebihi batas maksimal transaksi (${currenciesFormat('idr', targetTotalIdr)})`
        );
        return;
      }
      if (totalCreditIdrCombined > targetTotalIdr) {
        toast.error(
          `Total kredit IDR (${currenciesFormat('idr', totalCreditIdrCombined)}) melebihi batas maksimal transaksi (${currenciesFormat('idr', targetTotalIdr)})`
        );
        return;
      }
    }

    // Validation against max totals USD
    if (targetTotalUsd > 0) {
      if (totalDebitUsdCombined > targetTotalUsd) {
        toast.error(
          `Total debit USD (${currenciesFormat('usd', totalDebitUsdCombined)}) melebihi batas maksimal transaksi (${currenciesFormat('usd', targetTotalUsd)})`
        );
        return;
      }
      if (totalCreditUsdCombined > targetTotalUsd) {
        toast.error(
          `Total kredit USD (${currenciesFormat('usd', totalCreditUsdCombined)}) melebihi batas maksimal transaksi (${currenciesFormat('usd', targetTotalUsd)})`
        );
        return;
      }
    }

    setIsSubmittingMass(true);
    try {
      for (const row of filledRows) {
        const isDebit = row.debit > 0;
        const amount = isDebit ? row.debit : row.credit;
        const type = isDebit ? 'debet' : 'credit';
        const kas = kasOptions.find((k) => Number(k.id) === Number(row.cash_id));
        const isUsd = isUsdKas(kas);
        const amountOriginal = isUsd ? Number(row.amount_original || 0) : amount;

        const payload: FinanceBillingPayload = {
          cash_flow_id: cashFlowDetail.id,
          cash_id: row.cash_id,
          account_id: row.account_id,
          type,
          amount,
          amount_original: amountOriginal,
          payment_at: row.payment_at,
          note: row.note || '',
        };

        await createMutation.mutateAsync(payload);
      }

      toast.success(`Berhasil menyimpan ${filledRows.length} entri jurnal pembayaran`);
      setDraftRows([createNewDraftRow()]);
    } catch (error) {
      toast.error(getApiErrorMessage(error) || 'Gagal menyimpan data jurnal');
    } finally {
      setIsSubmittingMass(false);
    }
  };

  // Delete saved row
  const handleDelete = async () => {
    if (!deleteTarget || deleteMutation.isPending) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Pembayaran jurnal berhasil dihapus');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error) || 'Gagal menghapus pembayaran');
      setDeleteTarget(null);
    }
  };

  const getKasLabel = useCallback(
    (cashId: number) => {
      const kas = kasOptions.find((k) => Number(k.id) === cashId);
      return kas ? kas.cash_name || `${kas.code} - ${kas.description}` : '-';
    },
    [kasOptions]
  );

  const getAccountLabel = useCallback(
    (accountId: number) => {
      const akun = akunOptions.find((a) => Number(a.id) === accountId);
      if (!akun) return '-';
      const rawType = akun.type || '';
      const typeLabel = rawType.toLowerCase() === 'credit' ? 'Credit' : (rawType.toLowerCase() === 'debet' || rawType.toLowerCase() === 'debit') ? 'Debit' : rawType || 'Debit';
      return `[${typeLabel}] ${akun.code} - ${akun.name}`;
    },
    [akunOptions]
  );

  // Check if both Debit and Credit are full for their respective currencies
  const isDebitIdrFull = targetTotalIdr > 0 ? totalDebitIdrCombined >= targetTotalIdr : true;
  const isCreditIdrFull = targetTotalIdr > 0 ? totalCreditIdrCombined >= targetTotalIdr : true;
  const isDebitUsdFull = targetTotalUsd > 0 ? totalDebitUsdCombined >= targetTotalUsd : true;
  const isCreditUsdFull = targetTotalUsd > 0 ? totalCreditUsdCombined >= targetTotalUsd : true;

  const isBothFull =
    (targetTotalIdr > 0 || targetTotalUsd > 0) &&
    (targetTotalIdr <= 0 || (isDebitIdrFull && isCreditIdrFull)) &&
    (targetTotalUsd <= 0 || (isDebitUsdFull && isCreditUsdFull));

  return (
    <div className="space-y-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Header Info */}
      <div className="flex flex-col items-stretch gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-semibold text-slate-900">Jurnal Pembayaran</h3>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-600 font-medium">
              {(cashFlowDetail.unit_transaction_billing_id || cashFlowDetail.goods_transaction_billing_id) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="cursor-help text-[#18385b] hover:text-[#102843] transition-colors flex items-center">
                        <Info className="h-3.5 w-3.5 mr-0.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="max-w-xs bg-slate-900 text-white rounded-md p-2 text-xs shadow-md">
                      Data Arus Transaksi Kas Harian ini terhubung dengan Administrasi
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <span>Ref: {cashFlowDetail.code}</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Entri jurnal pembayaran langsung pada tabel.
            {targetTotalIdr > 0 && ` Target IDR: ${currenciesFormat('idr', targetTotalIdr)}.`}
            {targetTotalUsd > 0 && ` Target USD: ${currenciesFormat('usd', targetTotalUsd)}.`}
          </p>
        </div>

        {/* Balancing Status Badge */}
        <div className="flex items-center gap-2">
          {totalDebitIdrCombined === totalCreditIdrCombined && totalDebitIdrCombined > 0 &&
           (targetTotalUsd <= 0 || (totalDebitUsdCombined === totalCreditUsdCombined && totalDebitUsdCombined > 0)) ? (
            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold px-3 py-1 text-xs">
              Seimbang (Balance)
            </Badge>
          ) : totalDebitIdrCombined === targetTotalIdr && targetTotalIdr > 0 && totalCreditIdrCombined === 0 ? (
            <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 font-semibold px-3 py-1 text-xs">
              Debit Terpenuhi (Kredit Opsional)
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 font-semibold px-3 py-1 text-xs">
              Belum Seimbang
            </Badge>
          )}
        </div>
      </div>

      {/* Interactive Table with Inline Entry */}
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <Table className="w-full text-xs">
          <TableHeader className="bg-slate-50/90 border-b border-slate-200 text-slate-700">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center font-bold">No</TableHead>
              <TableHead className="w-40 sm:w-44 font-bold">Tanggal Bayar</TableHead>
              <TableHead className="min-w-[220px] font-bold">Akun</TableHead>
              <TableHead className="min-w-[180px] font-bold">Kas</TableHead>
              <TableHead className="min-w-[180px] text-right font-bold">Debit (Nominal)</TableHead>
              <TableHead className="min-w-[180px] text-right font-bold">Kredit (Nominal)</TableHead>
              <TableHead className="min-w-[180px] font-bold">Catatan</TableHead>
              <TableHead className="w-20 text-center font-bold sticky right-0 bg-slate-50">Aksi</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* 1. Existing Saved Billings */}
            {financeBillings.map((fb, idx) => {
              const debitSide = isFbDebit(fb);
              const creditSide = isFbCredit(fb);
              const currency = isUsdKas(fb.cash) ? 'usd' : 'idr';

              return (
                <TableRow key={fb.id} className="hover:bg-slate-50/70">
                  <TableCell className="text-center font-medium text-slate-400">{idx + 1}</TableCell>
                  <TableCell className="font-medium text-slate-800">{formatDate(fb.payment_at)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <ReferenceLink href={`/dashboard/${slugStr}/master/account?search=${encodeURIComponent(fb.account?.name || '')}`}>
                        {getAccountLabel(fb.account_id)}
                      </ReferenceLink>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.2 rounded font-semibold',
                            debitSide ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                          )}
                        >
                          {debitSide ? 'Debit' : 'Credit'}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ReferenceLink href={`/dashboard/${slugStr}/master/kas?search=${encodeURIComponent(getKasLabel(fb.cash_id))}`}>
                      {getKasLabel(fb.cash_id)}
                    </ReferenceLink>
                  </TableCell>
                  <TableCell className="text-right">
                    {debitSide ? (
                      <div className="flex flex-col items-end">
                        <span className="font-semibold tabular-nums text-emerald-700">
                          {currenciesFormat(currency, fb.amount)}
                        </span>
                        {isUsdKas(fb.cash) && Number(fb.amount_original || 0) > 0 && (
                          <span className="text-[10px] text-slate-500 tabular-nums">
                            Konversi IDR: {currenciesFormat('idr', fb.amount_original)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 font-bold">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {creditSide ? (
                      <div className="flex flex-col items-end">
                        <span className="font-semibold tabular-nums text-rose-700">
                          {currenciesFormat(currency, fb.amount)}
                        </span>
                        {isUsdKas(fb.cash) && Number(fb.amount_original || 0) > 0 && (
                          <span className="text-[10px] text-slate-500 tabular-nums">
                            Konversi IDR: {currenciesFormat('idr', fb.amount_original)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 font-bold">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600 max-w-[200px] truncate">{fb.note || '-'}</TableCell>
                  <TableCell className="text-center sticky right-0 bg-white">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={disabled}
                      onClick={() => setDeleteTarget(fb)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                      title="Hapus jurnal tersimpan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}

            {/* 2. Draft New Rows (Default minimal 1 baris) */}
            {draftRows.map((row, draftIdx) => {
              const kas = kasOptions.find((k) => Number(k.id) === Number(row.cash_id));
              const isSelectedKasUsd = isUsdKas(kas);
              const selectedCurrency = isSelectedKasUsd ? 'usd' : 'idr';
              const maxDebitForRow = getMaxDebitForRow(row.tempId);
              const maxCreditForRow = getMaxCreditForRow(row.tempId);
              const isDebitInputDisabled = disabled || (maxDebitForRow <= 0 && row.debit <= 0);
              const isCreditInputDisabled = disabled || (maxCreditForRow <= 0 && row.credit <= 0);

              return (
                <TableRow key={row.tempId} className="bg-blue-50/30 hover:bg-blue-50/50 border-b border-blue-100">
                  <TableCell className="text-center font-bold text-blue-900">
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-blue-100 text-[10px]">
                      +{financeBillings.length + draftIdx + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <InputDate
                      value={row.payment_at}
                      onChange={(e) => handleDraftFieldChange(row.tempId, 'payment_at', e.target.value)}
                      isEdit={true}
                      defaultToday={true}
                      className="h-9 text-xs bg-white"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.account_id ? String(row.account_id) : undefined}
                      onValueChange={(val) => handleDraftAccountChange(row.tempId, Number(val))}
                    >
                      <SelectTrigger className="h-9 w-full bg-white text-xs border-slate-200">
                        <SelectValue placeholder="Pilih akun..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60" showSearch searchPlaceholder="Cari akun...">
                        {akunOptions.map((a) => {
                          const isAlreadySelected = selectedAccountIds.has(Number(a.id)) && Number(a.id) !== row.account_id;
                          const rawType = a.type || '';
                          const typeLabel = rawType.toLowerCase() === 'credit' ? 'Credit' : (rawType.toLowerCase() === 'debet' || rawType.toLowerCase() === 'debit') ? 'Debit' : rawType || 'Debit';
                          return (
                            <SelectItem key={a.id} value={String(a.id)} disabled={isAlreadySelected}>
                              <div className="flex items-center justify-between gap-2 w-full">
                                <span className={cn(isAlreadySelected && 'text-slate-400 line-through')}>
                                   <span className={cn('font-bold mr-1', typeLabel === 'Debit' ? 'text-blue-600' : 'text-purple-600')}>
                                    [{typeLabel}]
                                  </span>
                                  {a.code} - {a.name}
                                </span>
                                {isAlreadySelected && (
                                  <span className="text-[10px] text-amber-600 font-medium">(Sudah dipilih)</span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.cash_id ? String(row.cash_id) : undefined}
                      onValueChange={(val) => handleDraftCashChange(row.tempId, Number(val))}
                    >
                      <SelectTrigger className="h-9 w-full bg-white text-xs border-slate-200">
                        <SelectValue placeholder="Pilih kas..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60" showSearch searchPlaceholder="Cari kas...">
                        {kasOptions.map((k) => (
                          <SelectItem key={k.id} value={String(k.id)}>
                            <span>{k.cash_name || `${k.code} - ${k.description}`}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right align-top">
                    <div className="flex flex-col gap-1.5">
                      <MoneyInput
                        value={row.debit}
                        onChangeValue={(val) => handleDraftDebitChange(row.tempId, val)}
                        currency={selectedCurrency.toUpperCase()}
                        disabled={isDebitInputDisabled}
                        placeholder={maxDebitForRow <= 0 ? 'Maksimal' : '0'}
                        className={cn(
                          'h-9 text-xs text-right font-semibold bg-white',
                          isDebitInputDisabled ? 'text-slate-400 bg-slate-100 opacity-60 cursor-not-allowed' : 'text-emerald-700'
                        )}
                      />
                      {isSelectedKasUsd && (
                        <div className="flex flex-col items-end gap-0.5 rounded border border-amber-300 bg-amber-50/70 p-1.5 text-right">
                          <span className="text-[9px] font-semibold text-amber-800">Konversi IDR (Debit):</span>
                          <MoneyInput
                            value={row.debit > 0 ? row.amount_original : 0}
                            onChangeValue={(val) => handleDraftFieldChange(row.tempId, 'amount_original', val)}
                            currency="IDR"
                            placeholder="Isi kurs/konversi IDR..."
                            disabled={disabled || isDebitInputDisabled || row.debit <= 0}
                            className="h-7 text-[10px] text-right bg-white border-amber-300"
                          />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right align-top">
                    <div className="flex flex-col gap-1.5">
                      <MoneyInput
                        value={row.credit}
                        onChangeValue={(val) => handleDraftCreditChange(row.tempId, val)}
                        currency={selectedCurrency.toUpperCase()}
                        disabled={isCreditInputDisabled}
                        placeholder={maxCreditForRow <= 0 ? 'Maksimal' : '0'}
                        className={cn(
                          'h-9 text-xs text-right font-semibold bg-white',
                          isCreditInputDisabled ? 'text-slate-400 bg-slate-100 opacity-60 cursor-not-allowed' : 'text-rose-700'
                        )}
                      />
                      {isSelectedKasUsd && (
                        <div className="flex flex-col items-end gap-0.5 rounded border border-amber-300 bg-amber-50/70 p-1.5 text-right">
                          <span className="text-[9px] font-semibold text-amber-800">Konversi IDR (Kredit):</span>
                          <MoneyInput
                            value={row.credit > 0 ? row.amount_original : 0}
                            onChangeValue={(val) => handleDraftFieldChange(row.tempId, 'amount_original', val)}
                            currency="IDR"
                            placeholder="Isi kurs/konversi IDR..."
                            disabled={disabled || isCreditInputDisabled || row.credit <= 0}
                            className="h-7 text-[10px] text-right bg-white border-amber-300"
                          />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.note}
                      onChange={(e) => handleDraftFieldChange(row.tempId, 'note', e.target.value)}
                      placeholder="Catatan..."
                      className="h-9 text-xs bg-white"
                    />
                  </TableCell>
                  <TableCell className="text-center sticky right-0 bg-blue-50/50">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                      onClick={() => handleRemoveDraftRow(row.tempId)}
                      title={draftRows.length <= 1 ? 'Kosongkan baris' : 'Hapus baris draft'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>

          {/* Table Footer: Totals & Balance indicator */}
          <TableFooter className="bg-slate-50/90 border-t-2 border-slate-300 font-semibold text-xs">
            {/* IDR Totals */}
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4} className="py-2.5 px-4 text-right uppercase tracking-wider text-slate-700 font-bold">
                Total Jurnal IDR
              </TableCell>
              <TableCell className="py-2.5 px-4 text-right font-bold text-emerald-800 tabular-nums">
                {currenciesFormat('idr', totalDebitIdrCombined)}
              </TableCell>
              <TableCell className="py-2.5 px-4 text-right font-bold text-rose-800 tabular-nums">
                {currenciesFormat('idr', totalCreditIdrCombined)}
              </TableCell>
              <TableCell colSpan={2} className="py-2.5 px-4 text-center">
                <span className="text-[11px] text-slate-600 font-medium">
                  Selisih: {currenciesFormat('idr', Math.abs(totalDebitIdrCombined - totalCreditIdrCombined))}
                </span>
              </TableCell>
            </TableRow>

            {/* USD Totals (if transaction has USD or USD rows exist) */}
            {(targetTotalUsd > 0 || totalDebitUsdCombined > 0 || totalCreditUsdCombined > 0) && (
              <TableRow className="hover:bg-transparent bg-slate-100/70 border-t border-slate-200">
                <TableCell colSpan={4} className="py-2.5 px-4 text-right uppercase tracking-wider text-blue-900 font-bold">
                  Total Jurnal USD
                </TableCell>
                <TableCell className="py-2.5 px-4 text-right font-bold text-emerald-800 tabular-nums">
                  {currenciesFormat('usd', totalDebitUsdCombined)}
                </TableCell>
                <TableCell className="py-2.5 px-4 text-right font-bold text-rose-800 tabular-nums">
                  {currenciesFormat('usd', totalCreditUsdCombined)}
                </TableCell>
                <TableCell colSpan={2} className="py-2.5 px-4 text-center">
                  <span className="text-[11px] text-slate-600 font-medium">
                    Selisih: {currenciesFormat('usd', Math.abs(totalDebitUsdCombined - totalCreditUsdCombined))}
                  </span>
                </TableCell>
              </TableRow>
            )}
          </TableFooter>
        </Table>
      </div>

      {/* Action Buttons Below the Table */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
        {isBothFull ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    className="w-full sm:w-auto text-slate-400 border-dashed border-slate-200 cursor-not-allowed"
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
            onClick={handleAddNewRow}
            disabled={disabled}
            className="w-full sm:w-auto text-slate-700 hover:text-slate-900 border-dashed border-slate-300 hover:border-slate-400"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Tambah Jurnal
          </Button>
        )}

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Button
            type="button"
            onClick={() => void handleMassSave()}
            disabled={disabled || isSubmittingMass || draftRows.length === 0}
            loading={isSubmittingMass}
            className="w-full sm:w-auto btn-primary-orange"
          >
            <Check className="mr-1.5 h-4 w-4" />
            Simpan Jurnal
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Alert Dialog for Saved Billings */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jurnal?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus pembayaran sebesar{' '}
              <span className="font-semibold">{deleteTarget ? currenciesFormat(isUsdKas(deleteTarget.cash) ? 'usd' : 'idr', deleteTarget.amount) : ''}</span>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteMutation.isPending}
              onClick={() => void handleDelete()}
            >
              {deleteMutation.isPending ? (
                <>
                  <LoadingState variant="inline" text={null} />
                  Menghapus...
                </>
              ) : (
                'Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
