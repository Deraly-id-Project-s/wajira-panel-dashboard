'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { Plus, Info, Trash2, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import RequiredMark from '@/components/ui/required-mark';
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

const isUsdKas = (kas?: { currency_type?: string | null; code?: string | null } | null) => {
  if (!kas) return false;
  if ((kas.currency_type || '').toLowerCase() === 'usd') return true;
  return (kas.code || '').toLowerCase().includes('usd');
};

interface DraftBillingRow {
  tempId: string;
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

export default function FinanceBillingTable({
  financeBillings,
  cashFlowDetail,
  companyId,
  disabled = false,
}: Props) {
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

  // Task 1: Check whether cash flow is a USD transaction
  const isUsdTransaction = useMemo(() => {
    if (cashFlowDetail.is_usd_transaction !== undefined && cashFlowDetail.is_usd_transaction !== null) {
      return Boolean(
        cashFlowDetail.is_usd_transaction === true ||
        cashFlowDetail.is_usd_transaction === 1 ||
        cashFlowDetail.is_usd_transaction === '1' ||
        cashFlowDetail.is_usd_transaction === 'true'
      );
    }
    return Boolean(
      Number(cashFlowDetail.debet_usd_total || 0) > 0 ||
      Number(cashFlowDetail.credit_usd_total || 0) > 0 ||
      Number(cashFlowDetail.grand_total_usd || 0) > 0 ||
      Number(cashFlowDetail.remaining_payment_usd || 0) > 0 ||
      Number(cashFlowDetail.debet_usd || 0) > 0 ||
      Number(cashFlowDetail.credit_usd || 0) > 0 ||
      (cashFlowDetail.cash_flow_cashes ?? []).some((c) => (c.cash?.currency_type || '').toLowerCase() === 'usd')
    );
  }, [
    cashFlowDetail.is_usd_transaction,
    cashFlowDetail.debet_usd_total,
    cashFlowDetail.credit_usd_total,
    cashFlowDetail.grand_total_usd,
    cashFlowDetail.remaining_payment_usd,
    cashFlowDetail.debet_usd,
    cashFlowDetail.credit_usd,
    cashFlowDetail.cash_flow_cashes,
  ]);

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

  // Primary target amount according to currency
  const primaryTargetAmount = isUsdTransaction ? targetTotalUsd : targetTotalIdr;

  // Helper to determine if a saved billing is Debit or Credit
  const isFbCredit = useCallback(
    (fb: FinanceBilling) => {
      const rawType = (fb.type || (fb as any).type || (fb as any).direction || '').toLowerCase().trim();
      if (rawType === 'credit') return true;
      if (rawType === 'debet' || rawType === 'debit') return false;
      const acc = akunOptions.find((a) => Number(a.id) === Number(fb.account_id));
      const accType = (fb.account?.type || acc?.type || '').toLowerCase().trim();
      return accType === 'credit';
    },
    [akunOptions]
  );

  const isFbDebit = useCallback(
    (fb: FinanceBilling) => !isFbCredit(fb),
    [isFbCredit]
  );

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

  // Function to create a clean draft row matching currency requirement
  const createNewDraftRow = useCallback((): DraftBillingRow => {
    let defaultCashId = 0;
    const matchingKas = kasOptions.find((k) => (isUsdTransaction ? isUsdKas(k) : !isUsdKas(k)));

    if (matchingKas) {
      defaultCashId = Number(matchingKas.id);
    } else if (kasOptions[0]) {
      defaultCashId = Number(kasOptions[0].id);
    }

    return {
      tempId: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      account_id: 0,
      cash_id: defaultCashId,
      debit: 0,
      credit: 0,
      amount_original: 0,
      note: '',
    };
  }, [kasOptions, isUsdTransaction]);

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

  // Synchronize default cash_id with currency restriction
  useEffect(() => {
    if (kasOptions.length > 0) {
      const matchingKas = kasOptions.find((k) => (isUsdTransaction ? isUsdKas(k) : !isUsdKas(k)));
      const defaultCash = matchingKas || kasOptions[0];

      if (defaultCash) {
        setDraftRows((prev) =>
          prev.map((r) => {
            const currentKas = kasOptions.find((k) => Number(k.id) === Number(r.cash_id));
            const currentIsUsd = isUsdKas(currentKas);
            const isMismatched = isUsdTransaction ? !currentIsUsd : currentIsUsd;
            if (r.cash_id === 0 || (r.cash_id > 0 && isMismatched && r.debit === 0 && r.credit === 0)) {
              return { ...r, cash_id: Number(defaultCash.id) };
            }
            return r;
          })
        );
      }
    }
  }, [kasOptions, isUsdTransaction]);

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

  // Settlement & Balancing Statuses matching GeneralJournalForm
  const isDebitSettled = isUsdTransaction
    ? targetTotalUsd > 0 && totalDebitUsdCombined >= targetTotalUsd
    : targetTotalIdr > 0 && totalDebitIdrCombined >= targetTotalIdr;

  const isCreditSettled = isUsdTransaction
    ? targetTotalUsd > 0 && totalCreditUsdCombined >= targetTotalUsd
    : targetTotalIdr > 0 && totalCreditIdrCombined >= targetTotalIdr;

  const isPrimarySettled = cashFlowDirection === 'debet' ? isDebitSettled : isCreditSettled;
  const isBalanced = primaryTargetAmount > 0 && isDebitSettled && isCreditSettled;
  const isBothFull = primaryTargetAmount > 0 && isDebitSettled && isCreditSettled;

  // Add new draft row
  const handleAddNewRow = () => {
    setDraftRows((prev) => [...prev, createNewDraftRow()]);
  };

  // Copy draft row (duplicates debit, credit, amount_original, cash_id, note, resets account_id: 0)
  const handleCopyDraftRow = (tempId: string) => {
    const row = draftRows.find((r) => r.tempId === tempId);
    if (!row) return;

    const maxDeb = getMaxDebitForRow(tempId);
    const maxCred = getMaxCreditForRow(tempId);

    const copiedDebit = row.debit > 0 ? Math.min(row.debit, maxDeb) : 0;
    const copiedCredit = row.credit > 0 ? Math.min(row.credit, maxCred) : 0;

    const newRow: DraftBillingRow = {
      tempId: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      account_id: 0,
      cash_id: row.cash_id,
      debit: copiedDebit,
      credit: copiedCredit,
      amount_original: row.amount_original || 0,
      note: row.note || '',
    };

    setDraftRows((prev) => [...prev, newRow]);
    toast.info('Baris pembayaran berhasil disalin. Silakan pilih akun COA untuk baris baru.');
  };

  // Copy saved row to draft entry
  const handleCopySavedRow = (fb: FinanceBilling) => {
    const debitSide = isFbDebit(fb);
    const amount = Number(fb.amount || 0);

    const newRow: DraftBillingRow = {
      tempId: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      account_id: 0,
      cash_id: Number(fb.cash_id || 0),
      debit: debitSide ? amount : 0,
      credit: !debitSide ? amount : 0,
      amount_original: Number(fb.amount_original || 0),
      note: fb.note || '',
    };

    setDraftRows((prev) => [...prev, newRow]);
    toast.info('Baris pembayaran berhasil disalin ke draf entri baru. Silakan pilih akun COA.');
  };

  // Remove or reset draft row (if 1 row remains, reset to clean default)
  const handleRemoveDraftRow = (tempId: string) => {
    if (draftRows.length <= 1) {
      setDraftRows([createNewDraftRow()]);
      toast.info('Baris pembayaran telah dikosongkan');
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
    if (maxDebit <= 0 && value > 0) {
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
    if (maxCredit <= 0 && value > 0) {
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

  const handleDraftFieldChange = (tempId: string, field: 'note' | 'amount_original', value: any) => {
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

      const kas = kasOptions.find((k) => Number(k.id) === Number(row.cash_id));
      const isKasUsd = isUsdKas(kas);

      // Task 1: Strict currency enforcement
      if (isUsdTransaction && !isKasUsd) {
        toast.error(`Transaksi USD hanya boleh memilih Kas USD pada baris ke-${rowNum}`);
        return;
      }
      if (!isUsdTransaction && isKasUsd) {
        toast.error(`Transaksi IDR hanya boleh memilih Kas IDR pada baris ke-${rowNum}`);
        return;
      }

      if (row.debit <= 0 && row.credit <= 0) {
        toast.error(`Nominal debit atau kredit harus lebih dari 0 pada baris ke-${rowNum}`);
        return;
      }
      if (row.debit > 0 && row.credit > 0) {
        toast.error(`Wajib memilih salah satu antara debit atau kredit pada baris ke-${rowNum}`);
        return;
      }

      if (isKasUsd && Number(row.amount_original || 0) <= 0) {
        toast.error(`Nominal konversi IDR (kurs) wajib ditentukan manual untuk kas USD pada baris ke-${rowNum}`);
        return;
      }
    }

    // Validation against max totals IDR
    if (!isUsdTransaction && targetTotalIdr > 0) {
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
    if (isUsdTransaction && targetTotalUsd > 0) {
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

    const defaultPaymentDate = (() => {
      const dateVal = cashFlowDetail.date;
      if (!dateVal) return format(getTodayWIB(), 'yyyy-MM-dd');
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
      const part = dateVal.split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(part)) return part;
      try {
        return format(new Date(dateVal), 'yyyy-MM-dd');
      } catch {
        return format(getTodayWIB(), 'yyyy-MM-dd');
      }
    })();

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
          payment_at: defaultPaymentDate,
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
      const typeLabel =
        rawType.toLowerCase() === 'credit'
          ? 'Credit'
          : rawType.toLowerCase() === 'debet' || rawType.toLowerCase() === 'debit'
          ? 'Debit'
          : rawType || 'Debit';
      return `[${typeLabel}] ${akun.code} - ${akun.name}`;
    },
    [akunOptions]
  );

  return (
    <div className="space-y-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Header Info / Status Keseimbangan */}
      <div className="flex flex-col items-stretch gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Rincian Pembayaran Jurnal</h3>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-600 font-medium">
              {(cashFlowDetail.unit_transaction_billing_id || cashFlowDetail.goods_transaction_billing_id) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="cursor-help text-[#18385b] hover:text-[#102843] transition-colors flex items-center"
                      >
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
          <p className="text-xs text-slate-600 font-medium mt-1">
            Target Nominal:{' '}
            <span className="font-bold text-slate-900">
              {isUsdTransaction ? currenciesFormat('usd', targetTotalUsd) : currenciesFormat('idr', targetTotalIdr)}
            </span>
            {' '}&bull; Posisi Utama:{' '}
            <span className={cn('font-bold', cashFlowDirection === 'debet' ? 'text-emerald-700' : 'text-rose-700')}>
              {cashFlowDirection === 'debet' ? 'Debet (Wajib Lunas)' : 'Kredit (Wajib Lunas)'}
            </span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Pilih akun COA dan kas, lalu tentukan nominal pada kolom Debit atau Kredit (maksimal tidak boleh melebihi target transaksi).
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
              {cashFlowDirection === 'debet' ? 'Debet Terpenuhi (Kredit Belum Seimbang)' : 'Kredit Terpenuhi (Debet Belum Seimbang)'}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 font-semibold px-3 py-1 text-xs">
              {cashFlowDirection === 'debet' ? 'Debet Belum Lunas' : 'Kredit Belum Lunas'}
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
              <TableHead className="min-w-[240px] font-bold">
                Akun <RequiredMark />
              </TableHead>
              <TableHead className="min-w-[180px] font-bold">
                Kas <RequiredMark />
              </TableHead>
              <TableHead className="min-w-[180px] text-right font-bold">
                Debit (Nominal) {cashFlowDirection === 'debet' && <span className="text-emerald-700 font-bold">*Wajib</span>}
              </TableHead>
              <TableHead className="min-w-[180px] text-right font-bold">
                Kredit (Nominal) {cashFlowDirection === 'credit' && <span className="text-rose-700 font-bold">*Wajib</span>}
              </TableHead>
              <TableHead className="min-w-[180px] font-bold">Catatan</TableHead>
              <TableHead className="w-24 text-center font-bold sticky right-0 bg-slate-50">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* 1. Existing Saved Billings */}
            {financeBillings.map((fb, idx) => {
              const debitSide = isFbDebit(fb);
              const creditSide = isFbCredit(fb);
              const currency = isUsdKas(fb.cash) ? 'usd' : 'idr';

              return (
                <TableRow key={fb.id} className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors">
                  <TableCell className="text-center font-medium text-slate-400">{idx + 1}</TableCell>
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
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                        title="Salin baris ini ke draf entri baru"
                        disabled={disabled || isBothFull}
                        onClick={() => handleCopySavedRow(fb)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={disabled}
                        onClick={() => setDeleteTarget(fb)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                        title="Hapus jurnal tersimpan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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

              const isDebitFilled = row.debit > 0;
              const isCreditFilled = row.credit > 0;

              const isDebitInputDisabled =
                disabled || isCreditFilled || (primaryTargetAmount > 0 && maxDebitForRow <= 0 && row.debit <= 0);
              const isCreditInputDisabled =
                disabled || isDebitFilled || (primaryTargetAmount > 0 && maxCreditForRow <= 0 && row.credit <= 0);

              return (
                <TableRow
                  key={row.tempId}
                  className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors"
                >
                  {/* Nomor Baris */}
                  <TableCell className="text-center font-medium text-slate-400">
                    {financeBillings.length + draftIdx + 1}
                  </TableCell>

                  {/* Pemilihan Akun (Searchable / Filtered & Disable Duplikat) */}
                  <TableCell>
                    <Select
                      value={row.account_id ? String(row.account_id) : undefined}
                      onValueChange={(val) => handleDraftAccountChange(row.tempId, Number(val))}
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-9 w-full bg-white text-xs border-slate-200">
                        <SelectValue placeholder="Pilih akun..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60" showSearch searchPlaceholder="Cari akun...">
                        {akunOptions.map((a) => {
                          const isAlreadySelected =
                            selectedAccountIds.has(Number(a.id)) && Number(a.id) !== row.account_id;
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
                                      typeLabel === 'Debit' ? 'text-blue-600' : 'text-purple-600'
                                    )}
                                  >
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

                  {/* Pemilihan Kas (Task 1: Disable jika tidak sesuai is_usd_transaction) */}
                  <TableCell>
                    <Select
                      value={row.cash_id ? String(row.cash_id) : undefined}
                      onValueChange={(val) => handleDraftCashChange(row.tempId, Number(val))}
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-9 w-full bg-white text-xs border-slate-200">
                        <SelectValue placeholder="Pilih kas..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60" showSearch searchPlaceholder="Cari kas...">
                        {kasOptions.map((k) => {
                          const isKasUsd = isUsdKas(k);
                          const isMismatched = isUsdTransaction ? !isKasUsd : isKasUsd;

                          return (
                            <SelectItem key={k.id} value={String(k.id)} disabled={isMismatched}>
                              <div className="flex items-center justify-between gap-2 w-full">
                                <span className={cn(isMismatched && 'text-slate-400 line-through')}>
                                  {k.cash_name || `${k.code} - ${k.description}`}
                                </span>
                                {isMismatched && (
                                  <span className="text-[10px] text-amber-600 font-medium">
                                    {isUsdTransaction ? '(Hanya Kas USD)' : '(Hanya Kas IDR)'}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Debit (Nominal) - Terkunci jika Kredit terisi atau kuota debit habis */}
                  <TableCell className="text-right align-top">
                    <div className="flex flex-col items-end gap-1">
                      <MoneyInput
                        value={row.debit}
                        onChangeValue={(val) => handleDraftDebitChange(row.tempId, val)}
                        currency={selectedCurrency.toUpperCase()}
                        disabled={isDebitInputDisabled}
                        placeholder={
                          isCreditFilled
                            ? 'Kredit aktif'
                            : primaryTargetAmount > 0 && maxDebitForRow <= 0
                            ? 'Maksimal'
                            : '0'
                        }
                        className={cn(
                          'h-9 text-xs text-right font-semibold bg-white',
                          isDebitInputDisabled
                            ? 'text-slate-400 bg-slate-100 opacity-60 cursor-not-allowed'
                            : 'text-emerald-700'
                        )}
                      />
                      {primaryTargetAmount > 0 && !isCreditFilled && maxDebitForRow > 0 && maxDebitForRow < primaryTargetAmount && (
                        <span className="text-[9px] text-slate-400">
                          Maks: {currenciesFormat(selectedCurrency, maxDebitForRow)}
                        </span>
                      )}
                      {isSelectedKasUsd && (
                        <div className="flex flex-col items-end gap-0.5 rounded border border-amber-300 bg-amber-50/70 p-1.5 text-right w-full mt-1">
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

                  {/* Kredit (Nominal) - Terkunci jika Debit terisi atau kuota kredit habis */}
                  <TableCell className="text-right align-top">
                    <div className="flex flex-col items-end gap-1">
                      <MoneyInput
                        value={row.credit}
                        onChangeValue={(val) => handleDraftCreditChange(row.tempId, val)}
                        currency={selectedCurrency.toUpperCase()}
                        disabled={isCreditInputDisabled}
                        placeholder={
                          isDebitFilled
                            ? 'Debit aktif'
                            : primaryTargetAmount > 0 && maxCreditForRow <= 0
                            ? 'Maksimal'
                            : '0'
                        }
                        className={cn(
                          'h-9 text-xs text-right font-semibold bg-white',
                          isCreditInputDisabled
                            ? 'text-slate-400 bg-slate-100 opacity-60 cursor-not-allowed'
                            : 'text-rose-700'
                        )}
                      />
                      {primaryTargetAmount > 0 && !isDebitFilled && maxCreditForRow > 0 && maxCreditForRow < primaryTargetAmount && (
                        <span className="text-[9px] text-slate-400">
                          Maks: {currenciesFormat(selectedCurrency, maxCreditForRow)}
                        </span>
                      )}
                      {isSelectedKasUsd && (
                        <div className="flex flex-col items-end gap-0.5 rounded border border-amber-300 bg-amber-50/70 p-1.5 text-right w-full mt-1">
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

                  {/* Catatan */}
                  <TableCell>
                    <Input
                      value={row.note}
                      onChange={(e) => handleDraftFieldChange(row.tempId, 'note', e.target.value)}
                      placeholder="Catatan..."
                      className="h-9 text-xs bg-white"
                      disabled={disabled}
                    />
                  </TableCell>

                  {/* Aksi: Copy Icon & Hapus Icon */}
                  <TableCell className="text-center sticky right-0 bg-white">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                        title="Salin baris ini (nominal dan catatan)"
                        disabled={disabled || isBothFull}
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
                        disabled={disabled}
                        onClick={() => handleRemoveDraftRow(row.tempId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>

          {/* Table Footer: Totals & Balance indicator matching GeneralJournalForm */}
          <TableFooter className="bg-slate-50/90 border-t-2 border-slate-300 font-semibold text-xs">
            {!isUsdTransaction ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="py-2.5 px-4 text-right uppercase tracking-wider text-slate-700 font-bold">
                  Total Jurnal IDR
                </TableCell>
                <TableCell className="py-2.5 px-4 text-right font-bold text-emerald-800 tabular-nums">
                  <div>{currenciesFormat('idr', totalDebitIdrCombined)}</div>
                  {targetTotalIdr > 0 && totalDebitIdrCombined < targetTotalIdr && (
                    <div className="text-[10px] text-amber-700 font-normal">
                      Sisa: {currenciesFormat('idr', Math.max(0, targetTotalIdr - totalDebitIdrCombined))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-2.5 px-4 text-right font-bold text-rose-800 tabular-nums">
                  <div>{currenciesFormat('idr', totalCreditIdrCombined)}</div>
                  {targetTotalIdr > 0 && totalCreditIdrCombined < targetTotalIdr && (
                    <div className="text-[10px] text-amber-700 font-normal">
                      Sisa: {currenciesFormat('idr', Math.max(0, targetTotalIdr - totalCreditIdrCombined))}
                    </div>
                  )}
                </TableCell>
                <TableCell colSpan={2} className="py-2.5 px-4 text-center">
                  <span className="text-[11px] text-slate-600 font-medium">
                    Selisih: {currenciesFormat('idr', Math.abs(totalDebitIdrCombined - totalCreditIdrCombined))}
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="py-2.5 px-4 text-right uppercase tracking-wider text-blue-900 font-bold">
                  Total Jurnal USD
                </TableCell>
                <TableCell className="py-2.5 px-4 text-right font-bold text-emerald-800 tabular-nums">
                  <div>{currenciesFormat('usd', totalDebitUsdCombined)}</div>
                  {targetTotalUsd > 0 && totalDebitUsdCombined < targetTotalUsd && (
                    <div className="text-[10px] text-amber-700 font-normal">
                      Sisa: {currenciesFormat('usd', Math.max(0, targetTotalUsd - totalDebitUsdCombined))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-2.5 px-4 text-right font-bold text-rose-800 tabular-nums">
                  <div>{currenciesFormat('usd', totalCreditUsdCombined)}</div>
                  {targetTotalUsd > 0 && totalCreditUsdCombined < targetTotalUsd && (
                    <div className="text-[10px] text-amber-700 font-normal">
                      Sisa: {currenciesFormat('usd', Math.max(0, targetTotalUsd - totalCreditUsdCombined))}
                    </div>
                  )}
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

      {/* Action Button Tambah Jurnal di Bawah Tabel & Simpan Jurnal */}
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
            onClick={handleAddNewRow}
            disabled={disabled}
            className="w-full sm:w-auto text-slate-700 hover:text-slate-900 border-dashed border-slate-300 hover:border-slate-400 text-xs"
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
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white text-xs"
          >
            {isSubmittingMass ? (
              <LoadingState variant="inline" text="Menyimpan..." iconClassName="text-white" />
            ) : (
              <>
                <Check className="mr-1.5 h-4 w-4" />
                Simpan Jurnal
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Alert Dialog for Saved Billings */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jurnal?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus pembayaran sebesar{' '}
              <span className="font-semibold">
                {deleteTarget
                  ? currenciesFormat(isUsdKas(deleteTarget.cash) ? 'usd' : 'idr', deleteTarget.amount)
                  : ''}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
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
