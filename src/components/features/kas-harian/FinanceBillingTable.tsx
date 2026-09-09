'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Plus, Pencil, Trash2, Info, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FormDialog } from '@/components/ui/form-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
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

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatMoneyInput = (value: string) => {
  const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const formatMoneyValue = (value: number) => formatMoneyInput(String(Math.max(0, Math.floor(value))));

const parseMoneyInput = (value: string) => {
  const normalized = value.replace(/\D/g, '');
  if (!normalized) return 0;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
};

interface FormState {
  cash_id: number;
  account_id: number;
  amount: string;
  payment_at: string;
  note: string;
}


const EMPTY_FORM: FormState = {
  cash_id: 0,
  account_id: 0,
  amount: '',
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

  const currentTransactionType = useMemo<'debet' | 'credit' | undefined>(() => {
    if (
      cashFlowDetail.cash_flow_type === 'debet' ||
      cashFlowDetail.cash_flow_type === 'debit' ||
      Number(cashFlowDetail.debet || 0) > 0 ||
      Number(cashFlowDetail.debet_usd || 0) > 0
    ) {
      return 'debet';
    }
    if (
      cashFlowDetail.cash_flow_type === 'credit' ||
      Number(cashFlowDetail.credit || 0) > 0 ||
      Number(cashFlowDetail.credit_usd || 0) > 0
    ) {
      return 'credit';
    }
    return undefined;
  }, [cashFlowDetail]);

  const kasQuery = useKas(companyId > 0 ? companyId : undefined);
  const accountQuery = useAccounts({
    page: 1,
    perPage: 1000,
    search: '',
    company_id: companyId > 0 ? companyId : undefined,
    type: currentTransactionType,
    enabled: companyId > 0,
  });

  const kasOptions = useMemo(() => kasQuery.data?.data ?? [], [kasQuery.data?.data]);
  const rawAkunOptions = useMemo(() => accountQuery.data?.data ?? [], [accountQuery.data?.data]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [deleteTarget, setDeleteTarget] = useState<FinanceBilling | null>(null);

  const akunOptions = useMemo(() => {
    if (!currentTransactionType) return rawAkunOptions;
    return rawAkunOptions.filter((account) => {
      if (form.account_id && Number(account.id) === Number(form.account_id)) {
        return true;
      }
      if (!account.type) return true;
      const normalizedType = account.type === 'debit' ? 'debet' : account.type;
      return normalizedType === currentTransactionType;
    });
  }, [rawAkunOptions, currentTransactionType, form.account_id]);

  const totalPaid = useMemo(
    () => financeBillings.reduce((sum, fb) => sum + Number(fb.amount || 0), 0),
    [financeBillings],
  );
  const grandTotal = Number(cashFlowDetail.grand_total || cashFlowDetail.unit_transaction_billing?.grand_total || 0);
  const cashFlowCurrency = Number(cashFlowDetail.debet_usd || cashFlowDetail.credit_usd || 0) > 0 ? 'usd' : 'idr';
  const cashFlowAmount = cashFlowCurrency === 'usd'
    ? Number(cashFlowDetail.debet_usd || cashFlowDetail.credit_usd || 0)
    : Number(cashFlowDetail.amount || cashFlowDetail.debet || cashFlowDetail.credit || grandTotal || 0);

  const expectedIdr = Number(cashFlowDetail.debet) > 0 ? Number(cashFlowDetail.debet) : Number(cashFlowDetail.credit ?? 0);
  const totalPaidIdr = useMemo(
    () => financeBillings.filter(fb => !fb.cash?.code?.toLowerCase().includes('usd')).reduce((sum, fb) => sum + Number(fb.amount || 0), 0),
    [financeBillings]
  );
  const remainingPaymentIdr = Math.max(0, expectedIdr - totalPaidIdr);

  const expectedUsd = Number(cashFlowDetail.debet_usd) > 0 ? Number(cashFlowDetail.debet_usd) : Number(cashFlowDetail.credit_usd ?? 0);
  const totalPaidUsd = useMemo(
    () => financeBillings.filter(fb => fb.cash?.code?.toLowerCase().includes('usd')).reduce((sum, fb) => sum + Number(fb.amount || 0), 0),
    [financeBillings]
  );
  const remainingPaymentUsd = Math.max(0, expectedUsd - totalPaidUsd);

  const hasIdr = expectedIdr > 0;
  const hasUsd = expectedUsd > 0;
  const isFullyPaid = (hasIdr ? remainingPaymentIdr <= 0 : true) && (hasUsd ? remainingPaymentUsd <= 0 : true);

  const editingItem = useMemo(() => financeBillings.find((fb) => fb.id === editingId) || null, [editingId, financeBillings]);
  const editingAmount = Number(editingItem?.amount || 0);
  const editingIsUsd = editingItem?.cash?.code?.toLowerCase().includes('usd');

  const selectedKas = useMemo(
    () => kasOptions.find((kas) => Number(kas.id) === Number(form.cash_id)) ?? null,
    [form.cash_id, kasOptions],
  );
  const selectedAkun = useMemo(
    () => akunOptions.find((a) => Number(a.id) === Number(form.account_id)) ?? rawAkunOptions.find((a) => Number(a.id) === Number(form.account_id)) ?? null,
    [form.account_id, akunOptions, rawAkunOptions],
  );
  const selectedCurrency = selectedKas?.code?.toLowerCase().endsWith('_usd') ? 'usd' : 'idr';
  const selectedCurrencySymbol = selectedCurrency === 'usd' ? '$' : 'Rp';
  const formatSelectedCurrency = (value: number) => currenciesFormat(selectedCurrency, value);

  const maxPaymentAmount = useMemo(() => {
    if (selectedCurrency === 'usd') {
      const editOffset = (editingId && editingIsUsd) ? editingAmount : 0;
      return Math.max(0, expectedUsd - totalPaidUsd + editOffset);
    } else {
      const editOffset = (editingId && !editingIsUsd) ? editingAmount : 0;
      return Math.max(0, expectedIdr - totalPaidIdr + editOffset);
    }
  }, [selectedCurrency, expectedUsd, totalPaidUsd, expectedIdr, totalPaidIdr, editingId, editingIsUsd, editingAmount]);

  const currentLimitCurrencyAmount = selectedCurrency === 'usd' ? expectedUsd : expectedIdr;
  const currentLimitCurrencyPaid = selectedCurrency === 'usd' ? totalPaidUsd : totalPaidIdr;
  const hasPaymentLimit = currentLimitCurrencyAmount > 0;

  const remainingPayment = Number(cashFlowDetail.remaining_payment ?? Math.max(0, grandTotal - totalPaid));

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const openAddForm = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      cash_id: cashFlowDetail.cash_id ?? 0,
      account_id: cashFlowDetail.account_id ?? 0,
      payment_at: cashFlowDetail.date?.slice(0, 10) || '',
    });
    setIsFormOpen(true);
  };

  const openEditForm = (fb: FinanceBilling) => {
    setEditingId(fb.id);
    setForm({
      cash_id: fb.cash_id,
      account_id: fb.account_id,
      amount: String(fb.amount || ''),
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
    const amount = parseMoneyInput(form.amount);
    if (amount <= 0) {
      toast.error('Nominal pembayaran harus lebih dari 0');
      return;
    }
    if (hasPaymentLimit && amount > maxPaymentAmount) {
      toast.error(`Nominal pembayaran maksimal ${formatSelectedCurrency(maxPaymentAmount)}`);
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
      amount_original: amount,
      payment_at: form.payment_at,
      note: form.note,
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
      closeForm();
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
    const akun = rawAkunOptions.find((a) => Number(a.id) === accountId);
    return akun ? (akun.name || `${akun.code} - ${akun.description}`) : '-';
  }, [rawAkunOptions]);

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
        cell: (fb) => (
          <ReferenceLink href={`/dashboard/${slugStr}/master/account?search=${encodeURIComponent(getKasLabel(fb.account_id))}`}>
            {getAccountLabel(fb.account_id)}
          </ReferenceLink>
        ),
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
          <span className="font-semibold text-slate-900">
            {currenciesFormat(fb?.cash?.code?.toLowerCase().endsWith('_usd') ? 'usd' : 'idr', fb.amount)}
          </span>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" disabled={isFullyPaid}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditForm(fb)} className="cursor-pointer">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteTarget(fb)} className="cursor-pointer text-red-600 focus:text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null,
      },
    ],
    [disabled, isFullyPaid, slugStr, getAccountLabel, getKasLabel]
  );

  return (
    <div className="space-y-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col items-stretch gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-semibold text-slate-900">Rincian Pembayaran</h3>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5 text-xs text-slate-600 font-medium">
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
          <Button type="button" onClick={openAddForm} variant="default" disabled={isFullyPaid} className="w-full sm:w-auto">
            <Plus className="mr-1.5 h-4 w-4" />
            Tambah Pembayaran
          </Button>
        )}
      </div>

      <BaseTable
        data={financeBillings}
        loading={isLoading}
        columns={columns}
      />

      {/* Summary */}
      <div className="flex flex-col items-stretch gap-2 border-t border-slate-100 pt-4 text-sm sm:items-end">
        {!(hasIdr && hasUsd) ? (
          <>
            <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
              <span className="text-slate-500">Total Pembayaran:</span>
              <span className="font-bold text-slate-900">{currenciesFormat(cashFlowCurrency, totalPaid)}</span>
            </div>
            <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
              <span className="text-slate-500">Sisa Tagihan:</span>
              <span className={`font-bold ${remainingPayment > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {currenciesFormat(cashFlowCurrency, remainingPayment)}
              </span>
            </div>
          </>
        ) : (
          <div className="w-full flex flex-col sm:flex-row justify-between gap-4 text-xs mt-2 border-t border-slate-50 pt-3">
            <div className="space-y-1">
              <div className="font-semibold text-slate-700">Rincian Rupiah (IDR):</div>
              <div className="flex flex-col items-start gap-1 text-slate-500 sm:flex-row sm:items-center sm:gap-4">
                <span>Terbayar: <strong className="text-slate-800">{currenciesFormat('idr', totalPaidIdr)}</strong></span>
                <span>Sisa: <strong className={remainingPaymentIdr > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>{currenciesFormat('idr', remainingPaymentIdr)}</strong></span>
              </div>
            </div>
            <div className="space-y-1 sm:text-right">
              <div className="font-semibold text-slate-700">Rincian Dollar (USD):</div>
              <div className="flex flex-col items-start gap-1 text-slate-500 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
                <span>Terbayar: <strong className="text-slate-800">{currenciesFormat('usd', totalPaidUsd)}</strong></span>
                <span>Sisa: <strong className={remainingPaymentUsd > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>{currenciesFormat('usd', remainingPaymentUsd)}</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <FormDialog
        open={isFormOpen}
        onOpenChange={(open: boolean) => { if (!open) closeForm(); }}
        title={editingId ? 'Edit Pembayaran' : 'Tambah Pembayaran Baru'}
        onSubmit={(e: React.FormEvent) => { e.preventDefault(); void handleSubmitForm(); }}
        maxWidthClassName="sm:max-w-5xl"
        isSubmitting={isLoading}
      >
        <div className="space-y-4">
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <div className="font-semibold">Maksimal nominal: {formatSelectedCurrency(maxPaymentAmount)}</div>
            <div className="mt-0.5 text-amber-700">
              Total transaksi {formatSelectedCurrency(currentLimitCurrencyAmount)} - total terbayar {formatSelectedCurrency(currentLimitCurrencyPaid)}
              {editingId ? ` + nominal pembayaran ini ${formatSelectedCurrency(editingAmount)}` : ''}.
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Kas */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">Kas</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Select
                        value={form.cash_id ? String(form.cash_id) : undefined}
                        onValueChange={(v) => setForm((prev) => ({ ...prev, cash_id: Number(v) }))}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-11 w-full bg-white text-sm border-slate-200 text-slate-700">
                          <SelectValue placeholder="Pilih kas" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60" showSearch searchPlaceholder="Cari kas...">
                          {kasOptions.map((k) => (
                            <SelectItem key={k.id} value={String(k.id)}>
                              {k.cash_name || `${k.code} - ${k.description}`}
                            </SelectItem>
                          ))}
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

            {/* Akun */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">Akun</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Select
                        value={form.account_id ? String(form.account_id) : undefined}
                        onValueChange={(v) => setForm((prev) => ({ ...prev, account_id: Number(v) }))}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-11 w-full bg-white text-sm border-slate-200 text-slate-700">
                          <SelectValue placeholder="Pilih akun" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60" showSearch searchPlaceholder="Cari akun...">
                          {akunOptions.map((a) => (
                            <SelectItem key={a.id} value={String(a.id)}>
                              {a.code} - {a.name}
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Nominal */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">Nominal</label>
              <Input
                value={form.amount}
                onChange={(e) => {
                  const nextAmount = parseMoneyInput(e.target.value);
                  const clampedAmount = hasPaymentLimit ? Math.min(nextAmount, maxPaymentAmount) : nextAmount;
                  setForm((prev) => ({ ...prev, amount: clampedAmount > 0 ? formatMoneyValue(clampedAmount) : '' }));
                }}
                placeholder={`${selectedCurrencySymbol} 0`}
                inputMode="numeric"
                className="h-11"
                disabled={isLoading}
              />
            </div>

            {/* Tanggal Bayar */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">Tanggal Bayar</label>
              <Input
                type="date"
                value={form.payment_at}
                onChange={(e) => setForm((prev) => ({ ...prev, payment_at: e.target.value }))}
                className="h-11"
                disabled={isLoading}
              />
            </div>
          </div>

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
            <AlertDialogTitle>Hapus Pembayaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus pembayaran sebesar{' '}
              <span className="font-semibold">{deleteTarget ? currenciesFormat(deleteTarget.cash?.code?.toLowerCase().endsWith('_usd') ? 'usd' : 'idr', deleteTarget.amount) : ''}</span>?
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
