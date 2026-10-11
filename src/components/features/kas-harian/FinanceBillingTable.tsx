'use client';

import { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Plus, Info, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FormDialog } from '@/components/ui/form-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MoneyInput } from '@/components/ui/money-input';
import { InputDate } from '@/components/ui/input-date';
import { Textarea } from '@/components/ui/textarea';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ReferenceLink } from '@/components/ui/reference-link';
import { useCreateFinanceBilling, useUpdateFinanceBilling, useDeleteFinanceBilling } from '@/hooks/useFinanceBilling';
import { useKas } from '@/hooks/useKas';
import { useAccounts } from '@/hooks/useAccount';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
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

interface FormState {
  cash_id: number;
  account_id: number;
  amount: number;
  amount_original: number;
  payment_at: string;
  note: string;
}

const EMPTY_FORM: FormState = {
  cash_id: 0,
  account_id: 0,
  amount: 0,
  amount_original: 0,
  payment_at: '',
  note: '',
};

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
  const updateMutation = useUpdateFinanceBilling();
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

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [deleteTarget, setDeleteTarget] = useState<FinanceBilling | null>(null);

  const originalFlowType = useMemo<'debet' | 'credit'>(() => {
    if (cashFlowDetail.cash_flow_type === 'credit') return 'credit';
    if (cashFlowDetail.cash_flow_type === 'debet' || cashFlowDetail.cash_flow_type === 'debit') return 'debet';
    if (Number(cashFlowDetail.debet_total || cashFlowDetail.debet || cashFlowDetail.cash_position?.debet_idr_total || 0) > 0) return 'debet';
    if (Number(cashFlowDetail.credit_total || cashFlowDetail.credit || cashFlowDetail.cash_position?.credit_idr_total || 0) > 0) return 'credit';
    return 'debet';
  }, [cashFlowDetail]);

  const dualFlowType = originalFlowType === 'debet' ? 'credit' : 'debet';

  // IDR total calculation - diakumulasikan dari semua kas IDR (cash_flow_cashes / cash_summaries / cash_position)
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

  const debetUsdTotal = Math.max(
    Number(cashFlowDetail.debet_usd_total || 0),
    Number(cashFlowDetail.cash_position?.debet_usd_total || 0),
    Number(cashFlowDetail.debet_usd || 0),
  );

  const creditUsdTotal = Math.max(
    Number(cashFlowDetail.credit_usd_total || 0),
    Number(cashFlowDetail.cash_position?.credit_usd_total || 0),
    Number(cashFlowDetail.credit_usd || 0),
  );

  const debetIdr = debetIdrTotal;
  const creditIdr = creditIdrTotal;
  const debetUsd = debetUsdTotal;
  const creditUsd = creditUsdTotal;

  const fallbackGrandTotal = Number(
    cashFlowDetail.grand_total ||
    cashFlowDetail.unit_transaction_billing?.grand_total ||
    cashFlowDetail.goods_transaction_billing?.grand_total ||
    cashFlowDetail.amount ||
    0,
  );
  const fallbackGrandTotalUsd = Number(cashFlowDetail.grand_total_usd || 0);
  const usdCostsTotal = (cashFlowDetail.unit_transaction_billing?.unit_transaction?.unit_transaction_usd_costs ?? []).reduce(
    (sum, c) => sum + Number(c.amount || 0),
    0,
  );

  const expectedOriginalIdr = originalFlowType === 'debet' ? (debetIdrTotal || fallbackGrandTotal) : (creditIdrTotal || fallbackGrandTotal);
  const expectedOriginalUsd = originalFlowType === 'debet' ? (debetUsdTotal || fallbackGrandTotalUsd || usdCostsTotal) : (creditUsdTotal || fallbackGrandTotalUsd || usdCostsTotal);

  const expectedDualIdr = dualFlowType === 'debet' ? debetIdrTotal : creditIdrTotal;
  const expectedDualUsd = dualFlowType === 'debet' ? debetUsdTotal : creditUsdTotal;

  const getBillingFlowType = useCallback((fb: FinanceBilling): 'original' | 'dual' => {
    const accType = fb.account?.type || akunOptions.find((a) => Number(a.id) === Number(fb.account_id))?.type;
    const norm = accType === 'debit' ? 'debet' : accType;
    if (norm === dualFlowType) return 'dual';
    return 'original';
  }, [akunOptions, dualFlowType]);

  const totalPaidOriginalIdr = useMemo(
    () => financeBillings.filter(fb => !isUsdKas(fb.cash) && getBillingFlowType(fb) === 'original').reduce((sum, fb) => sum + Number(fb.amount || 0), 0),
    [financeBillings, getBillingFlowType]
  );
  const totalPaidOriginalUsd = useMemo(
    () => financeBillings.filter(fb => isUsdKas(fb.cash) && getBillingFlowType(fb) === 'original').reduce((sum, fb) => sum + Number(fb.amount || 0), 0),
    [financeBillings, getBillingFlowType]
  );

  const totalPaidDualIdr = useMemo(
    () => financeBillings.filter(fb => !isUsdKas(fb.cash) && getBillingFlowType(fb) === 'dual').reduce((sum, fb) => sum + Number(fb.amount || 0), 0),
    [financeBillings, getBillingFlowType]
  );
  const totalPaidDualUsd = useMemo(
    () => financeBillings.filter(fb => isUsdKas(fb.cash) && getBillingFlowType(fb) === 'dual').reduce((sum, fb) => sum + Number(fb.amount || 0), 0),
    [financeBillings, getBillingFlowType]
  );

  // Total pembayaran IDR yang diakumulasikan dari semua kas IDR
  const totalPaidIdrAccumulated = useMemo(
    () => financeBillings.filter(fb => !isUsdKas(fb.cash)).reduce((sum, fb) => sum + Number(fb.amount || 0), 0),
    [financeBillings]
  );
  const totalPaidUsdAccumulated = useMemo(
    () => financeBillings.filter(fb => isUsdKas(fb.cash)).reduce((sum, fb) => sum + Number(fb.amount || 0), 0),
    [financeBillings]
  );

  const remainingOriginalIdr = cashFlowDetail.remaining_payment !== undefined
    ? Number(cashFlowDetail.remaining_payment)
    : Math.max(0, expectedOriginalIdr - totalPaidOriginalIdr);

  const remainingOriginalUsd = cashFlowDetail.remaining_payment_usd !== undefined
    ? Number(cashFlowDetail.remaining_payment_usd)
    : Math.max(0, expectedOriginalUsd - totalPaidOriginalUsd);

  const remainingDualIdr = cashFlowDetail.dual_remaining_payment !== undefined
    ? Number(cashFlowDetail.dual_remaining_payment)
    : Math.max(0, expectedDualIdr - totalPaidDualIdr);

  const remainingDualUsd = cashFlowDetail.dual_remaining_payment_usd !== undefined
    ? Number(cashFlowDetail.dual_remaining_payment_usd)
    : Math.max(0, expectedDualUsd - totalPaidDualUsd);

  const isOriginalSettled = remainingOriginalIdr <= 0 && remainingOriginalUsd <= 0;
  const isDualSettled = remainingDualIdr <= 0 && remainingDualUsd <= 0;
  // Transaksi sepenuhnya lunas bila kedua flow (original dan dual) sudah selesai
  const isCompletelySettled = isOriginalSettled && isDualSettled;

  const editingItem = useMemo(() => financeBillings.find((fb) => fb.id === editingId) || null, [editingId, financeBillings]);
  const editingAmount = Number(editingItem?.amount || 0);
  const editingIsUsd = isUsdKas(editingItem?.cash);
  const editingFlow = editingItem ? getBillingFlowType(editingItem) : 'original';

  const selectedKas = useMemo(
    () => kasOptions.find((kas) => Number(kas.id) === Number(form.cash_id)) ?? null,
    [form.cash_id, kasOptions],
  );
  const selectedAkun = useMemo(
    () => akunOptions.find((a) => Number(a.id) === Number(form.account_id)) ?? null,
    [form.account_id, akunOptions],
  );

  const selectedAccountFlow = useMemo<'original' | 'dual'>(() => {
    if (!selectedAkun?.type) return 'original';
    const norm = selectedAkun.type === 'debit' ? 'debet' : selectedAkun.type;
    return norm === dualFlowType ? 'dual' : 'original';
  }, [selectedAkun, dualFlowType]);

  const activeRemainingIdr = selectedAccountFlow === 'original' ? remainingOriginalIdr : remainingDualIdr;
  const activeRemainingUsd = selectedAccountFlow === 'original' ? remainingOriginalUsd : remainingDualUsd;

  const selectedCurrency = isUsdKas(selectedKas) ? 'usd' : 'idr';
  const formatSelectedCurrency = (value: number) => currenciesFormat(selectedCurrency, value);

  const maxPaymentAmount = useMemo(() => {
    const isUsd = selectedCurrency === 'usd';
    const targetRemaining = isUsd ? activeRemainingUsd : activeRemainingIdr;
    const isSameEditingFlow = Boolean(editingId && editingFlow === selectedAccountFlow && editingIsUsd === isUsd);
    const editOffset = isSameEditingFlow ? editingAmount : 0;
    return Math.max(0, targetRemaining + editOffset);
  }, [selectedCurrency, activeRemainingUsd, activeRemainingIdr, editingId, editingFlow, selectedAccountFlow, editingIsUsd, editingAmount]);

  const isKasDisabled = useCallback((k: { id: number | string; currency_type?: string | null; code?: string | null }) => {
    if (editingId && editingItem && Number(editingItem.cash_id) === Number(k.id)) {
      return false;
    }
    const isUsd = isUsdKas(k);
    if (isUsd) {
      const isSameEditingFlow = Boolean(editingId && editingFlow === selectedAccountFlow && editingIsUsd);
      const effectiveRemaining = activeRemainingUsd + (isSameEditingFlow ? editingAmount : 0);
      return effectiveRemaining <= 0;
    } else {
      const isSameEditingFlow = Boolean(editingId && editingFlow === selectedAccountFlow && !editingIsUsd);
      const effectiveRemaining = activeRemainingIdr + (isSameEditingFlow ? editingAmount : 0);
      return effectiveRemaining <= 0;
    }
  }, [editingId, editingItem, editingFlow, selectedAccountFlow, editingIsUsd, activeRemainingUsd, activeRemainingIdr, editingAmount]);

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const openAddForm = () => {
    setEditingId(null);

    // Prioritaskan flow yang masih memiliki sisa saldo
    const defaultFlow = !isOriginalSettled ? 'original' : 'dual';
    const targetAccounts = akunOptions.filter((a) => {
      const norm = a.type === 'debit' ? 'debet' : a.type;
      return defaultFlow === 'dual' ? norm === dualFlowType : norm !== dualFlowType;
    });

    const defaultAccountId = targetAccounts[0]?.id
      ? Number(targetAccounts[0].id)
      : (akunOptions[0]?.id ? Number(akunOptions[0].id) : 0);

    const targetRemIdr = defaultFlow === 'original' ? remainingOriginalIdr : remainingDualIdr;
    const targetRemUsd = defaultFlow === 'original' ? remainingOriginalUsd : remainingDualUsd;

    let defaultCashId = 0;
    if (targetRemUsd > 0 && targetRemIdr <= 0) {
      const usdKas = kasOptions.find((k) => isUsdKas(k));
      if (usdKas) defaultCashId = Number(usdKas.id);
    } else {
      const idrKas = kasOptions.find((k) => !isUsdKas(k));
      if (idrKas) defaultCashId = Number(idrKas.id);
      else if (kasOptions[0]) defaultCashId = Number(kasOptions[0].id);
    }

    const initialKas = kasOptions.find((k) => Number(k.id) === defaultCashId);
    const initialCurrency = isUsdKas(initialKas) ? 'usd' : 'idr';
    const initialLimit = initialCurrency === 'usd' ? targetRemUsd : targetRemIdr;

    setForm({
      cash_id: defaultCashId,
      account_id: defaultAccountId,
      amount: initialLimit > 0 ? initialLimit : 0,
      amount_original: 0,
      payment_at: cashFlowDetail.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      note: '',
    });
    setIsFormOpen(true);
  };

  const openEditForm = (fb: FinanceBilling) => {
    setEditingId(fb.id);
    setForm({
      cash_id: fb.cash_id,
      account_id: fb.account_id,
      amount: Number(fb.amount || 0),
      amount_original: Number(fb.amount_original || 0),
      payment_at: fb.payment_at?.slice(0, 10) || '',
      note: fb.note || '',
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleSubmitForm = async () => {
    if (isLoading) return;

    if (!form.cash_id) {
      toast.error('Kas wajib dipilih');
      return;
    }
    if (!form.account_id) {
      toast.error('Akun wajib dipilih');
      return;
    }
    const amount = Number(form.amount || 0);
    if (amount <= 0) {
      toast.error('Nominal pembayaran harus lebih dari 0');
      return;
    }
    if (maxPaymentAmount > 0 && amount > maxPaymentAmount) {
      toast.error(`Nominal pembayaran maksimal ${formatSelectedCurrency(maxPaymentAmount)}`);
      return;
    }
    if (maxPaymentAmount <= 0) {
      toast.error(`Sisa saldo alokasi ${selectedAccountFlow === 'dual' ? 'Dual Flow' : 'Original Flow'} (${selectedCurrency.toUpperCase()}) telah habis`);
      return;
    }

    const isSelectedKasUsd = isUsdKas(selectedKas);
    const amountOriginal = isSelectedKasUsd ? Number(form.amount_original || 0) : amount;

    if (isSelectedKasUsd && amountOriginal <= 0) {
      toast.error('Nominal konversi (IDR) harus lebih dari 0');
      return;
    }

    if (!form.payment_at) {
      toast.error('Tanggal bayar wajib diisi');
      return;
    }

    const payload: FinanceBillingPayload = {
      cash_flow_id: cashFlowDetail.id,
      cash_id: form.cash_id,
      account_id: form.account_id,
      amount,
      amount_original: amountOriginal,
      payment_at: form.payment_at,
      note: form.note || '',
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload });
        toast.success('Pembayaran berhasil diperbarui');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Pembayaran berhasil ditambahkan');
      }
      closeForm();
    } catch (error) {
      toast.error(getApiErrorMessage(error) || 'Gagal menyimpan pembayaran');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleteMutation.isPending) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Pembayaran berhasil dihapus');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error) || 'Gagal menghapus pembayaran');
      setDeleteTarget(null);
    }
  };

  const getKasLabel = useCallback((cashId: number) => {
    const kas = kasOptions.find((k) => Number(k.id) === cashId);
    return kas ? (kas.cash_name || `${kas.code} - ${kas.description}`) : '-';
  }, [kasOptions]);

  const getAccountLabel = useCallback((accountId: number) => {
    const akun = akunOptions.find((a) => Number(a.id) === accountId);
    const getAccountType = akun?.type ? ` (${akun?.type == 'debet' ? 'Debit' : 'Kredit'})` : ``;
    return akun ? (akun.name + getAccountType || `${akun.code} - ${akun.description}`) : '-';
  }, [akunOptions]);

  const columns = useMemo<ColumnDef<FinanceBilling>[]>(
    () => [
      {
        header: 'Tanggal Bayar',
        alignment: 'left',
        cell: (fb) => <span className="text-slate-800">{formatDate(fb.payment_at)}</span>,
      },
      {
        header: 'Akun',
        alignment: 'left',
        cell: (fb) => {
          const flow = getBillingFlowType(fb);
          const akun = akunOptions.find((a) => Number(a.id) === Number(fb.account_id));
          const type = fb.account?.type || akun?.type;
          return (
            <div className="flex flex-col gap-0.5">
              <ReferenceLink href={`/dashboard/${slugStr}/master/account?search=${encodeURIComponent(akun?.name || fb.account?.name || '')}`}>
                {getAccountLabel(fb.account_id)}
              </ReferenceLink>
              <div className="flex items-center gap-1.5 mt-0.5">
                {type ? (
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded font-semibold',
                    (type === 'debet' || type === 'debit')
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                  )}>
                    {(type === 'debet' || type === 'debit') ? 'Debit' : 'Kredit'}
                  </span>
                ) : null}
                <span className="text-[10px] text-slate-500 font-medium">
                  ({flow === 'dual' ? 'Dual Flow' : 'Original Flow'})
                </span>
              </div>
            </div>
          );
        },
      },
      {
        header: 'Kas',
        alignment: 'left',
        cell: (fb) => (
          <ReferenceLink href={`/dashboard/${slugStr}/master/kas?search=${encodeURIComponent(getKasLabel(fb.cash_id))}`}>
            {getKasLabel(fb.cash_id)}
          </ReferenceLink>
        ),
      },
      {
        header: 'Nominal',
        alignment: 'left',
        cell: (fb) => (
          <div className="flex flex-col">
            <span className="font-semibold tabular-nums text-slate-900">
              {currenciesFormat(isUsdKas(fb.cash) ? 'usd' : 'idr', fb.amount)}
            </span>
            {isUsdKas(fb.cash) && Number(fb.amount_original || 0) > 0 ? (
              <span className="text-xs text-slate-500 tabular-nums">
                Konversi: {currenciesFormat('idr', fb.amount_original)}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        header: 'Catatan',
        alignment: 'left',
        cell: (fb) => <span className="text-slate-600 max-w-[200px] truncate block">{fb.note || '-'}</span>,
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (fb) =>
          !disabled ? (
            <div className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                  <DropdownMenuItem
                    onClick={() => openEditForm(fb)}
                    className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteTarget(fb)}
                    className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null,
      },
    ],
    [disabled, slugStr, getAccountLabel, getKasLabel, akunOptions, getBillingFlowType]
  );

  return (
    <div className="space-y-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col items-stretch gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-semibold text-slate-900">Jurnal</h3>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-600 font-medium">
              {(cashFlowDetail.unit_transaction_billing_id || cashFlowDetail.goods_transaction_billing_id || cashFlowDetail.unit_transaction_billing || cashFlowDetail.goods_transaction_billing) ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="cursor-help text-[#18385b] hover:text-[#102843] transition-colors flex items-center">
                        <Info className="h-3.5 w-3.5 mr-0.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="max-w-xs bg-slate-900 text-white rounded-md p-2 text-xs shadow-md">
                      Data Arus Transaksi Kas Harian ini terhubung dengan data Administrasi
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
              <span>Ref: {cashFlowDetail.code}</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-1">Daftar finance billing yang terkait dengan transaksi ini</p>
        </div>
        {!disabled && (
          isCompletelySettled ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="default"
                      className="w-full sm:w-auto"
                      disabled
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      Tambah Jurnal
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-center text-xs">
                  Seluruh alokasi jurnal transaksi ini (original dan dual flow) telah lunas.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button
              type="button"
              onClick={openAddForm}
              variant="default"
              className="w-full sm:w-auto"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Tambah Jurnal
            </Button>
          )
        )}
      </div>

      {/* Indikator Saldo Dual Flow & Akumulasi Pembayaran IDR */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 text-xs">
        <div className="flex flex-col gap-1 rounded-md border border-slate-200 bg-slate-50/80 p-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Sisa Alokasi {originalFlowType === 'debet' ? 'Debit (Original)' : 'Kredit (Original)'}
          </span>
          <div className="flex flex-wrap items-baseline gap-2 font-semibold text-slate-900">
            <span className="tabular-nums">IDR: {currenciesFormat('idr', remainingOriginalIdr)}</span>
            {(remainingOriginalUsd > 0 || totalPaidOriginalUsd > 0) && (
              <span className="text-slate-600 tabular-nums">· USD: {currenciesFormat('usd', remainingOriginalUsd)}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 rounded-md border border-slate-200 bg-slate-50/80 p-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Sisa Alokasi {dualFlowType === 'debet' ? 'Debit (Dual Flow)' : 'Kredit (Dual Flow)'}
          </span>
          <div className="flex flex-wrap items-baseline gap-2 font-semibold text-slate-900">
            <span className="tabular-nums">IDR: {currenciesFormat('idr', remainingDualIdr)}</span>
            {(remainingDualUsd > 0 || totalPaidDualUsd > 0) && (
              <span className="text-slate-600 tabular-nums">· USD: {currenciesFormat('usd', remainingDualUsd)}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 rounded-md border border-emerald-200 bg-emerald-50/50 p-3 sm:col-span-2 lg:col-span-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            Total Terbayar IDR (Akumulasi Semua Kas)
          </span>
          <div className="flex flex-wrap items-baseline gap-2 font-semibold text-emerald-950">
            <span className="tabular-nums">{currenciesFormat('idr', totalPaidIdrAccumulated)}</span>
            {totalPaidUsdAccumulated > 0 && (
              <span className="text-emerald-800 text-[11px] tabular-nums">· USD: {currenciesFormat('usd', totalPaidUsdAccumulated)}</span>
            )}
          </div>
        </div>
      </div>

      <BaseTable
        data={financeBillings}
        loading={isLoading}
        columns={columns}
      />

      {/* Add / Edit Dialog */}
      <FormDialog
        open={isFormOpen}
        onOpenChange={(open: boolean) => { if (!open) closeForm(); }}
        title={editingId ? 'Edit Jurnal' : 'Tambah Jurnal Baru'}
        onSubmit={(e: React.FormEvent) => { e.preventDefault(); void handleSubmitForm(); }}
        maxWidthClassName="sm:max-w-5xl"
        isSubmitting={isLoading}
      >
        <div className="space-y-4">
          <div className="rounded-md border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">
                Alokasi Akun: {selectedAccountFlow === 'dual' ? `Dual Flow (${dualFlowType === 'debet' ? 'Debit' : 'Kredit'})` : `Original Flow (${originalFlowType === 'debet' ? 'Debit' : 'Kredit'})`}
              </span>
              <span className="font-bold tabular-nums">
                Maksimal: {formatSelectedCurrency(maxPaymentAmount)}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-blue-700">
              <span>Sisa Original: {currenciesFormat('idr', remainingOriginalIdr)}{remainingOriginalUsd > 0 ? ` · ${currenciesFormat('usd', remainingOriginalUsd)}` : ''}</span>
              <span>Sisa Dual: {currenciesFormat('idr', remainingDualIdr)}{remainingDualUsd > 0 ? ` · ${currenciesFormat('usd', remainingDualUsd)}` : ''}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Akun */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">Akun</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Select
                        value={form.account_id ? String(form.account_id) : undefined}
                        onValueChange={(v) => {
                          const nextAccountId = Number(v);
                          const nextAccount = akunOptions.find((a) => Number(a.id) === nextAccountId);
                          const norm = nextAccount?.type === 'debit' ? 'debet' : nextAccount?.type;
                          const nextFlow = norm === dualFlowType ? 'dual' : 'original';
                          const nextRemIdr = nextFlow === 'original' ? remainingOriginalIdr : remainingDualIdr;
                          const nextRemUsd = nextFlow === 'original' ? remainingOriginalUsd : remainingDualUsd;

                          let nextCashId = form.cash_id;
                          const currentKas = kasOptions.find((k) => Number(k.id) === form.cash_id);
                          const currentIsUsd = isUsdKas(currentKas);

                          if (currentIsUsd && nextRemUsd <= 0 && nextRemIdr > 0) {
                            const idrKas = kasOptions.find((k) => !isUsdKas(k));
                            if (idrKas) nextCashId = Number(idrKas.id);
                          } else if (!currentIsUsd && nextRemIdr <= 0 && nextRemUsd > 0) {
                            const usdKas = kasOptions.find((k) => isUsdKas(k));
                            if (usdKas) nextCashId = Number(usdKas.id);
                          }

                          const effectiveKas = kasOptions.find((k) => Number(k.id) === nextCashId);
                          const isUsd = isUsdKas(effectiveKas);
                          const targetRem = isUsd ? nextRemUsd : nextRemIdr;

                          setForm((prev) => ({
                            ...prev,
                            account_id: nextAccountId,
                            cash_id: nextCashId,
                            amount: targetRem > 0 && (prev.amount <= 0 || prev.amount > targetRem) ? targetRem : prev.amount,
                          }));
                        }}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-11 w-full bg-white text-sm border-slate-200 text-slate-700">
                          <SelectValue placeholder="Pilih akun" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60" showSearch searchPlaceholder="Cari akun...">
                          {akunOptions.map((a) => (
                            <SelectItem key={a.id} value={String(a.id)}>
                              {a.type ? <span className="font-bold">[{a.type == 'debet' ? 'Debit' : 'Kredit'}]</span> : ''} {a.code} - {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    {selectedAkun ? `${selectedAkun.code} - ${selectedAkun.name}` : 'Pilih akun'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Kas */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">Kas</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Select
                        value={form.cash_id ? String(form.cash_id) : undefined}
                        onValueChange={(v) => {
                          const nextCashId = Number(v);
                          const nextKas = kasOptions.find((k) => Number(k.id) === nextCashId);
                          const nextCurrency = isUsdKas(nextKas) ? 'usd' : 'idr';
                          const nextMax = nextCurrency === 'usd' ? activeRemainingUsd : activeRemainingIdr;
                          setForm((prev) => ({
                            ...prev,
                            cash_id: nextCashId,
                            amount: nextMax > 0 && (prev.amount > nextMax || prev.amount <= 0) ? nextMax : prev.amount,
                            amount_original: nextCurrency === 'usd' ? prev.amount_original : 0,
                          }));
                        }}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-11 w-full bg-white text-sm border-slate-200 text-slate-700">
                          <SelectValue placeholder="Pilih kas" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60" showSearch searchPlaceholder="Cari kas...">
                          {kasOptions.map((k) => {
                            const disabledKas = isKasDisabled(k);
                            return (
                              <SelectItem key={k.id} value={String(k.id)} disabled={disabledKas}>
                                <div className="flex items-center justify-between gap-2 w-full">
                                  <span>{k.cash_name || `${k.code} - ${k.description}`}</span>
                                  {disabledKas ? (
                                    <span className="text-[10px] text-rose-500 font-medium">(Saldo Habis)</span>
                                  ) : null}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    {selectedKas ? (selectedKas.cash_name || `${selectedKas.code} - ${selectedKas.description}`) : 'Pilih kas'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Nominal */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">Nominal</label>
              <MoneyInput
                value={form.amount}
                onChangeValue={(value) => {
                  const clamped = maxPaymentAmount > 0 ? Math.min(value, maxPaymentAmount) : value;
                  setForm((prev) => ({ ...prev, amount: clamped }));
                }}
                currency={selectedCurrency.toUpperCase()}
                className="h-11"
                disabled={isLoading}
              />
            </div>

            {/* Tanggal Bayar */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">Tanggal Bayar</label>
              <InputDate
                value={form.payment_at}
                onChange={(e) => setForm((prev) => ({ ...prev, payment_at: e.target.value }))}
                className="h-11"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Nominal Konversi (IDR) - Khusus Kas USD */}
          {isUsdKas(selectedKas) && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">Nominal Konversi (IDR)</label>
              <MoneyInput
                name="amount_original"
                value={form.amount_original}
                onChangeValue={(value) => setForm((prev) => ({ ...prev, amount_original: value }))}
                currency="IDR"
                className="h-11"
                disabled={isLoading}
                placeholder="Rp 0"
              />
            </div>
          )}

          {/* Catatan */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">Catatan</label>
            <Textarea
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Catatan pembayaran..."
              className="min-h-20 resize-none rounded-md"
              disabled={isLoading}
            />
          </div>
        </div>
      </FormDialog>

      {/* Delete Confirmation */}
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
