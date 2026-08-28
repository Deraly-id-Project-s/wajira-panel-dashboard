'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Plus, Pencil, Trash2, MoreHorizontal, Check, ChevronsUpDown, Info, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FormDialog } from '@/components/ui/form-dialog';
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

interface SearchableSelectProps<T> {
  value: number;
  onValueChange: (val: number) => void;
  options: T[];
  placeholder: string;
  searchPlaceholder: string;
  getLabel: (option: T) => string;
  getSearchText: (option: T) => string;
  disabled?: boolean;
}

function SearchableSelect<T extends { id: number | string }>({
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  getLabel,
  getSearchText,
  disabled,
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(() => {
    return options.find((opt) => Number(opt.id) === value) || null;
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => getSearchText(opt).toLowerCase().includes(q));
  }, [options, search, getSearchText]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={dropdownRef} className="relative w-full">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        className={cn(
          'h-11 w-full justify-between rounded-md border-slate-200 bg-white px-3 text-left font-normal hover:bg-white text-sm',
          !value && 'text-slate-400',
        )}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="truncate">
          {selectedOption ? getLabel(selectedOption) : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
      </Button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-[130] overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-2">
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-500">Data tidak ditemukan.</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = Number(opt.id) === value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
                    onClick={() => {
                      onValueChange(Number(opt.id));
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <Check className={cn('h-4 w-4 shrink-0 mt-0.5', isSelected ? 'opacity-100 text-slate-800' : 'opacity-0')} />
                    <span className="break-words whitespace-normal font-medium text-slate-700 leading-snug">{getLabel(opt)}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
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

  const getAccountLabel = useCallback((cashId: number) => {
    const akun = akunOptions.find((a) => Number(a.id) === cashId);
    return akun ? (akun.name || `${akun.code} - ${akun.description}`) : '-';
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
    <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-semibold text-slate-900">Rincian Pembayaran</h3>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-600 font-medium">
              {(cashFlowDetail.unit_transaction_billing_id || cashFlowDetail.goods_transaction_billing_id || cashFlowDetail.unit_transaction_billing || cashFlowDetail.goods_transaction_billing) ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="cursor-help text-[#18385b] hover:text-[#102843] transition-colors flex items-center">
                        <Info className="h-3.5 w-3.5 mr-0.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="max-w-xs bg-slate-900 text-white rounded-lg p-2 text-xs shadow-md">
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
          <Button type="button" onClick={openAddForm} className="button-theme-1! w-full sm:w-auto" disabled={isFullyPaid}>
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
      <div className="flex flex-col items-end gap-2 border-t border-slate-100 pt-4 text-sm">
        {!(hasIdr && hasUsd) ? (
          <>
            <div className="flex items-center gap-3">
              <span className="text-slate-500">Total Pembayaran:</span>
              <span className="font-bold text-slate-900">{currenciesFormat(cashFlowCurrency, totalPaid)}</span>
            </div>
            <div className="flex items-center gap-3">
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
              <div className="flex items-center gap-4 text-slate-500">
                <span>Terbayar: <strong className="text-slate-800">{currenciesFormat('idr', totalPaidIdr)}</strong></span>
                <span>Sisa: <strong className={remainingPaymentIdr > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>{currenciesFormat('idr', remainingPaymentIdr)}</strong></span>
              </div>
            </div>
            <div className="space-y-1 sm:text-right">
              <div className="font-semibold text-slate-700">Rincian Dollar (USD):</div>
              <div className="flex items-center gap-4 sm:justify-end text-slate-500">
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
        maxWidthClassName="max-w-4xl"
        isSubmitting={isLoading}
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Kas */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">Kas</label>
              <SearchableSelect
                value={form.cash_id}
                onValueChange={(v) => setForm((prev) => ({ ...prev, cash_id: v }))}
                options={kasOptions}
                placeholder="Pilih kas"
                searchPlaceholder="Cari kas..."
                getLabel={(k) => k.cash_name || `${k.code} - ${k.description}`}
                getSearchText={(k) => `${k.cash_name || ''} ${k.code} ${k.description}`}
                disabled={isLoading}
              />
            </div>

            {/* Akun */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">Akun</label>
              <SearchableSelect
                value={form.account_id}
                onValueChange={(v) => setForm((prev) => ({ ...prev, account_id: v }))}
                options={akunOptions}
                placeholder="Pilih akun"
                searchPlaceholder="Cari akun..."
                getLabel={(a) => `${a.code} - ${a.name}`}
                getSearchText={(a) => `${a.code} ${a.name}`}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Nominal */}
            <div className="space-y-2">
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <div className="font-semibold">Maksimal nominal: {formatSelectedCurrency(maxPaymentAmount)}</div>
                <div className="mt-0.5 text-amber-700">
                  Total transaksi {formatSelectedCurrency(currentLimitCurrencyAmount)} - total terbayar {formatSelectedCurrency(currentLimitCurrencyPaid)}
                  {editingId ? ` + nominal pembayaran ini ${formatSelectedCurrency(editingAmount)}` : ''}.
                </div>
              </div>
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
