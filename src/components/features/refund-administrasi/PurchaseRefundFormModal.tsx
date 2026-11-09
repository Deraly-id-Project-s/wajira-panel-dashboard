import { useEffect, useMemo, useCallback } from 'react';
import { z } from 'zod';
import { type FieldErrors, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PackageSearch } from 'lucide-react';
import type { UnitTransactionRefund } from '@/@types/refund.type';
import { useCreateRefund, useRefundDetail, useRefundSelectableItems, useUpdateRefund } from '@/hooks/useRefundAdministrasi';
import { createRefundSchema, type CreateRefundFormValues } from '@/schemas/refund.schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CopyBox } from '@/components/ui/copy-box';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MoneyInput } from '@/components/ui/money-input';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApiValidationError } from '@/lib/api/response';
import { toast } from 'sonner';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { isKasDisabledForTransaction } from '@/utils/payment-helpers';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { useCompany } from '@/contexts/CompanyContext';
import { useKas } from '@/hooks/useKas';
import { cn } from '@/lib/utils';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface PurchaseRefundFormModalProps {
  open: boolean;
  onClose: () => void;
  transactionId: string;
  refund?: UnitTransactionRefund | null;
  entityLabel?: 'pembelian' | 'penjualan';
  mode?: 'create' | 'edit' | 'detail';
}

type FormValues = CreateRefundFormValues & {
  status?: string;
  cash_id?: string;
};

const displayDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().split('T')[0] || '';
};

const getDisplayStatus = (refund?: UnitTransactionRefund | null) => {
  if (!refund) return 'belum-dibayar';
  const totalPaid = (refund.payments ?? []).reduce((total, item) => total + Number(item.amount), 0);
  if (totalPaid <= 0) return 'belum-dibayar';
  if (totalPaid >= Number(refund.refund_amount || 0)) return 'lunas';
  return 'proses';
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID');
};

const getRefundErrorMessage = (error: unknown, titleLabel: string) => {
  const rawMessage = error instanceof Error ? error.message : '';

  if (rawMessage === 'Failed to update unit transaction refund') {
    return 'Gagal memperbarui data refund. Backend mengembalikan error saat memproses status item unit.';
  }

  if (rawMessage === 'Failed to create unit transaction refund') {
    return 'Gagal membuat data refund.';
  }

  return rawMessage || `Gagal menyimpan data refund ${titleLabel}`;
};

const getFirstFormErrorMessage = (errors: FieldErrors<FormValues>) => {
  const messages = [
    errors.refund_amount?.message,
    errors.refund_date?.message,
    errors.unit_transaction_item_detail_ids?.message,
    errors.note?.message,
    errors.cash_id?.message,
  ];

  return messages.find((message): message is string => typeof message === 'string' && message.length > 0) ?? 'Lengkapi data refund terlebih dahulu.';
};

export default function PurchaseRefundFormModal({
  open,
  onClose,
  transactionId,
  refund,
  entityLabel = 'pembelian',
  mode,
}: PurchaseRefundFormModalProps) {
  const resolvedMode = mode ?? (refund ? 'edit' : 'create');
  const isDetail = resolvedMode === 'detail';
  const isEdit = resolvedMode === 'edit';
  const isCreate = resolvedMode === 'create';
  const titleLabel = entityLabel === 'penjualan' ? 'penjualan' : 'pembelian';

  const { companyId } = useCompany();
  const kasQuery = useKas(companyId ?? undefined);
  const kasOptions = useMemo(() => {
    const list = kasQuery.data?.data ?? [];
    return Array.isArray(list) ? list : [];
  }, [kasQuery.data?.data]);

  const createMutation = useCreateRefund();
  const updateMutation = useUpdateRefund();
  const refundDetailQuery = useRefundDetail(!isCreate && refund?.id ? refund.id : undefined);
  const effectiveRefund = refundDetailQuery.data ?? refund ?? null;
  const selectableItemsQuery = useRefundSelectableItems(transactionId);
  const selectableItems = selectableItemsQuery.items;

  // Task 3: Pengecekan unitTransaction.is_usd_transaction === true
  const unitTransaction = selectableItemsQuery.transactionQuery.data;
  const isUsdTransaction = Boolean(unitTransaction?.is_usd_transaction || (unitTransaction as any)?.is_usd_trasnaction);
  const currencyCode = isUsdTransaction ? 'usd' : 'idr';

  const parentTotalNominal = useMemo(() => {
    const raw = (unitTransaction as any)?.data ?? unitTransaction;
    if (!raw) return 0;
    const isUsd = Boolean(raw.is_usd_transaction || (raw as any).is_usd_trasnaction);
    if (isUsd) {
      return Number(raw.transaction_price_usd_total ?? (raw as any).unit_transaction_price_usd_total ?? 0);
    }
    return Number(raw.transaction_bruto_total ?? raw.unit_transaction_bruto_total ?? (raw as any).bruto_total ?? 0);
  }, [unitTransaction]);

  const displayedItems = useMemo(() => (isDetail ? effectiveRefund?.items ?? [] : selectableItems), [effectiveRefund?.items, isDetail, selectableItems]);
  const hasWarehouseReadyItems = useMemo(() => displayedItems.some((item) => item.in_stock), [displayedItems]);
  const lessPayment = effectiveRefund
    ? Math.max(0, Number(effectiveRefund.remaining_payment ?? Number(effectiveRefund.refund_amount || 0) - (effectiveRefund.payments ?? []).reduce((total, item) => total + Number(item.amount), 0)))
    : 0;
  const qty = effectiveRefund?.total_qty ?? effectiveRefund?.items?.length ?? 0;
  const selectedIdsFromRefund = useMemo(
    () =>
      effectiveRefund?.items
        ?.map((item) => Number(item.pivot?.unit_transaction_item_detail_id ?? item.id))
        .filter((value) => Number.isFinite(value)) ?? [],
    [effectiveRefund?.items],
  );

  const initialCashId = useMemo(() => {
    if (effectiveRefund?.payments?.[0]?.cash_id) {
      return String(effectiveRefund.payments[0].cash_id);
    }
    if ((effectiveRefund as any)?.cash_id) {
      return String((effectiveRefund as any).cash_id);
    }
    return '';
  }, [effectiveRefund]);

  const form = useForm<FormValues>({
    resolver: zodResolver(
      createRefundSchema.extend({
        status: z.string().optional(),
        cash_id: z.string().optional(),
      }),
    ),
    defaultValues: {
      unit_transaction_id: transactionId,
      refund_date: displayDate(effectiveRefund?.refund_date) || new Date().toISOString().split('T')[0],
      refund_amount: effectiveRefund?.refund_amount !== undefined && effectiveRefund?.refund_amount !== null ? Number(effectiveRefund.refund_amount) : undefined,
      note: effectiveRefund?.note || '',
      unit_transaction_item_detail_ids: selectedIdsFromRefund,
      cash_id: initialCashId,
      status: getDisplayStatus(effectiveRefund),
    },
  });

  const rawSelectedIds = form.watch('unit_transaction_item_detail_ids');
  const selectedIds = useMemo(() => rawSelectedIds ?? [], [rawSelectedIds]);
  const selectedItems = useMemo(
    () => displayedItems.filter((item) => selectedIds.includes(Number(item.id))),
    [displayedItems, selectedIds],
  );
  const selectedTotal = useMemo(
    () => selectedItems.reduce((total, item) => total + Number(item.price ?? 0), 0),
    [selectedItems],
  );

  const isItemDisabled = useCallback(
    (item: any) => {
      if (isDetail) return true;
      const status = item.status?.toLowerCase();
      const isRefundedOrReturned = status === 'returned' || status === 'refunded';
      if (isRefundedOrReturned) {
        if (isEdit && selectedIdsFromRefund.includes(Number(item.id))) {
          return false;
        }
        return true;
      }
      return false;
    },
    [isDetail, isEdit, selectedIdsFromRefund]
  );

  const selectableItemsForRefund = useMemo(
    () => displayedItems.filter((item) => !isItemDisabled(item)),
    [displayedItems, isItemDisabled]
  );

  const allSelected = selectableItemsForRefund.length > 0 && selectableItemsForRefund.every((item) => selectedIds.includes(Number(item.id)));

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      unit_transaction_id: transactionId,
      refund_date: displayDate(effectiveRefund?.refund_date) || new Date().toISOString().split('T')[0],
      refund_amount: effectiveRefund?.refund_amount !== undefined && effectiveRefund?.refund_amount !== null ? Number(effectiveRefund.refund_amount) : undefined,
      note: effectiveRefund?.note || '',
      unit_transaction_item_detail_ids: selectedIdsFromRefund,
      cash_id: initialCashId,
      status: getDisplayStatus(effectiveRefund),
    });
  }, [effectiveRefund, form, initialCashId, open, selectedIdsFromRefund, transactionId]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isLoadingItems =
    selectableItemsQuery.transactionQuery.isLoading ||
    selectableItemsQuery.itemDetailsQuery.isLoading ||
    (!isCreate && refundDetailQuery.isLoading);

  const toggleItem = (itemId: number, checked: boolean) => {
    const next = checked ? [...selectedIds, itemId] : selectedIds.filter((id) => id !== itemId);
    form.setValue('unit_transaction_item_detail_ids', next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const toggleAllItems = (checked: boolean) => {
    const selectableIds = selectableItemsForRefund.map((item) => Number(item.id));
    const next = checked
      ? Array.from(new Set([...selectedIds, ...selectableIds]))
      : selectedIds.filter((id) => !selectableIds.includes(id));
    form.setValue(
      'unit_transaction_item_detail_ids',
      next,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  const onSubmit = form.handleSubmit(
    async (values) => {
      const selectedWarehouseItems = displayedItems.filter((item) => (values.unit_transaction_item_detail_ids ?? []).includes(Number(item.id)));
      if (!isDetail && selectedWarehouseItems.some((item) => !item.in_stock)) {
        toast.error('Unit yang dipilih belum masuk ke stok warehouse. Pilih unit yang sudah diterima terlebih dahulu.');
        return;
      }

      try {
        if (isEdit && effectiveRefund) {
          await updateMutation.mutateAsync({
            id: effectiveRefund.id,
            payload: {
              unit_transaction_id: values.unit_transaction_id,
              refund_date: values.refund_date,
              refund_amount: values.refund_amount,
              note: values.note,
              unit_transaction_item_detail_ids: values.unit_transaction_item_detail_ids ?? [],
              cash_id: values.cash_id || undefined,
            },
          });
          toast.success(`Data refund ${titleLabel} berhasil diperbarui`);
        } else {
          await createMutation.mutateAsync({
            ...values,
            cash_id: values.cash_id || undefined,
          });
          toast.success(`Data refund ${titleLabel} berhasil ditambahkan`);
        }
        onClose();
      } catch (error: any) {
        if (error instanceof ApiValidationError) {
          const itemDetailErrors = error.fieldErrors.unit_transaction_item_detail_ids ?? error.fieldErrors['unit_transaction_item_detail_ids.0'];
          if (itemDetailErrors?.[0]) {
            form.setError('unit_transaction_item_detail_ids', {
              type: 'server',
              message: itemDetailErrors[0],
            });
          }
        }
        toast.error(getRefundErrorMessage(error, titleLabel));
      }
    },
    (errors) => {
      toast.error(getFirstFormErrorMessage(errors));
    },
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={
          'flex h-[calc(100vh-2rem)] max-h-[1080px] w-[calc(100vw-2rem)] max-w-[1420px] flex-col overflow-hidden rounded-[14px] border-none p-0 shadow-[0_20px_50px_rgba(15,23,42,0.25)] sm:h-[min(90vh,1080px)] sm:w-[calc(100vw-4rem)] sm:max-w-[1220px]'
        }
      >
        <DialogHeader className="shrink-0 px-6 pb-0 pt-7 text-left">
          <DialogTitle className="text-[18px] font-semibold text-[#111827]">
            {isDetail ? `Detail Refund ${titleLabel}` : isEdit ? `Ubah Data Refund ${titleLabel}` : `Tambah Data Refund ${titleLabel}`}
          </DialogTitle>
          {isUsdTransaction ? (
            <p className="mt-0.5 text-xs font-medium text-emerald-700">Transaksi Menggunakan Mata Uang USD ($)</p>
          ) : null}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-w-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-6 py-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="refund_date"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-medium text-slate-800">Tanggal Refund</FormLabel>
                      <FormControl>
                        <InputDate
                          readOnly={isDetail}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Task 3: Kas field dengan disable jika is_usd_transaction === true dan currency_type != usd */}
                <FormField
                  control={form.control}
                  name="cash_id"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-medium text-slate-800">
                        Akun Kas / Bank {isUsdTransaction ? '(Khusus USD)' : ''}
                      </FormLabel>
                      <Select
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        disabled={isDetail}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 w-full rounded-md border-slate-300 bg-white text-sm">
                            <SelectValue placeholder={kasQuery.isLoading ? 'Memuat kas...' : 'Pilih akun kas/bank'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {kasOptions.map((k) => {
                            const isUsdKas = String(k.currency_type || '').toLowerCase() === 'usd';
                            const isDisabled = isKasDisabledForTransaction(k.currency_type, isUsdTransaction, isDetail);
                            return (
                              <SelectItem
                                key={k.id}
                                value={String(k.id)}
                                disabled={isDisabled}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span>{k.cash_name || `${k.code} - ${k.description}`}</span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'text-[10px] font-semibold uppercase',
                                      isUsdKas
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                        : 'border-slate-200 bg-slate-50 text-slate-600',
                                    )}
                                  >
                                    {k.currency_type || 'IDR'}
                                  </Badge>
                                </div>
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

              {/* Task 3: Nominal refund dengan simbol USD jika is_usd_transaction === true */}
              <FormField
                control={form.control}
                name="refund_amount"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <FormLabel className="text-sm font-medium text-slate-800">
                          Nominal Refund ({isUsdTransaction ? 'USD' : 'IDR'})
                        </FormLabel>
                        {parentTotalNominal > 0 && !isDetail && (
                          <button
                            type="button"
                            onClick={() => form.setValue('refund_amount', parentTotalNominal, { shouldValidate: true })}
                            title="Klik untuk mengisi nominal dengan total transaksi"
                            className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200"
                          >
                            <span>Total: {currenciesFormat(currencyCode, parentTotalNominal)}</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <FormControl>
                      <MoneyInput
                        name={field.name}
                        value={Number(field.value) || 0}
                        onChangeValue={(val) => field.onChange(val)}
                        onBlur={field.onBlur}
                        disabled={isDetail}
                        currency={isUsdTransaction ? 'USD' : 'IDR'}
                        placeholder={isUsdTransaction ? '$ ' : 'Rp. '}
                        className="h-9 rounded-md border-slate-300 bg-white text-sm"
                      />
                    </FormControl>
                    {!form.formState.errors.refund_amount ? (
                      <p className="text-xs text-slate-500">
                        Nominal refund diisi manual. Nilai unit terpilih hanya sebagai referensi.
                      </p>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-medium text-slate-800">Catatan Refund</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: refund karena terdapat kecacatan"
                        readOnly={isDetail}
                        className="h-9 rounded-md border-slate-300 bg-white text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_transaction_item_detail_ids"
                render={() => (
                  <FormItem className="min-w-0 space-y-2 flex flex-col">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {isDetail ? 'Detail Unit yang Direfund' : 'Pilih Unit yang Direfund'}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {isDetail ? 'Daftar item detail unit yang termasuk ke refund ini.' : 'Checklist manual item detail yang ingin direfund.'}
                        </p>
                      </div>
                      <div className="shrink-0 text-sm font-semibold text-emerald-700">
                        Total Unit: {currenciesFormat(currencyCode, selectedTotal)}
                      </div>
                    </div>

                    <FormControl>
                      <div className="max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <div className="max-h-[260px] overflow-y-auto">
                          <div className="max-w-full overflow-x-auto">
                            <Table className="w-max min-w-full">
                              <TableHeader>
                                <TableRow className="bg-slate-100/70 hover:bg-slate-100/70">
                                  <TableHead className="w-14 px-4 text-center">
                                    <Checkbox
                                      checked={allSelected}
                                      disabled={isDetail || selectableItemsForRefund.length === 0}
                                      onCheckedChange={(checked) => toggleAllItems(Boolean(checked))}
                                    />
                                  </TableHead>
                                  <TableHead className="whitespace-nowrap px-4 text-slate-900">Warna</TableHead>
                                  <TableHead className="whitespace-nowrap px-4 text-slate-900">No. Mesin</TableHead>
                                  <TableHead className="whitespace-nowrap px-4 text-slate-900">No. Rangka</TableHead>
                                  <TableHead className="whitespace-nowrap px-4 text-slate-900">Status Stok</TableHead>
                                  <TableHead className="whitespace-nowrap px-4 text-slate-900">Status Forecast</TableHead>
                                  <TableHead className="whitespace-nowrap px-4 text-slate-900">Status Unit</TableHead>
                                  <TableHead className="whitespace-nowrap px-4 text-slate-900">Tanggal Dibuat</TableHead>
                                  <TableHead className="whitespace-nowrap px-4 text-right text-slate-900">Nilai</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {isLoadingItems ? (
                                  <TableRow>
                                    <TableCell colSpan={9} className="h-28 text-center text-slate-500">
                                      <div className="flex items-center justify-center gap-2">
                                        <LoadingState variant="inline" text={null} />
                                        Memuat unit transaksi...
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ) : displayedItems.length > 0 ? (
                                  displayedItems.map((item) => (
                                    <TableRow key={item.id} className="border-slate-200 hover:bg-slate-50/50">
                                      <TableCell className="px-4 py-2.5 text-center">
                                        <Checkbox
                                          checked={selectedIds.includes(Number(item.id))}
                                          disabled={isItemDisabled(item)}
                                          onCheckedChange={(checked) => toggleItem(Number(item.id), Boolean(checked))}
                                        />
                                      </TableCell>
                                      <TableCell className="whitespace-nowrap px-4 py-2.5 text-sm text-slate-800">{item.color || '-'}</TableCell>
                                      <TableCell className="whitespace-nowrap px-4 py-2.5 text-sm text-slate-800">
                                        <CopyBox text={item.machine_number || '-'} />
                                      </TableCell>
                                      <TableCell className="whitespace-nowrap px-4 py-2.5 text-sm text-slate-800">
                                        <CopyBox text={item.chassis_number || '-'} />
                                      </TableCell>
                                      <TableCell className="whitespace-nowrap px-4 py-2.5 text-sm text-slate-800">{item.in_stock ? 'Tersedia' : 'Tidak tersedia'}</TableCell>
                                      <TableCell className="whitespace-nowrap px-4 py-2.5 text-sm text-slate-800">{item.is_forecast ? 'Forecast' : 'Normal'}</TableCell>
                                      <TableCell className="whitespace-nowrap px-4 py-2.5 text-sm text-slate-800">
                                        <Badge
                                          variant="outline"
                                          className={cn(
                                            'font-semibold',
                                            item.status === 'refunded' || item.status === 'returned'
                                              ? 'border-orange-200 bg-orange-50 text-orange-700'
                                              : item.status === 'receive'
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                : 'border-slate-200 bg-slate-50 text-slate-700',
                                          )}
                                        >
                                          {item.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="whitespace-nowrap px-4 py-2.5 text-sm text-slate-800">{formatDate(item.created_at)}</TableCell>
                                      <TableCell className="whitespace-nowrap px-4 py-2.5 text-right text-sm font-medium text-slate-900">
                                        {currenciesFormat(currencyCode, Number(item.price ?? 0))}
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={9} className="h-28 text-center text-slate-500">
                                      <div className="flex flex-col items-center justify-center gap-2">
                                        <PackageSearch className="h-5 w-5" />
                                        {hasWarehouseReadyItems
                                          ? 'Tidak ada unit transaksi yang tersedia untuk direfund.'
                                          : 'Unit transaksi ini belum diterima dan belum masuk ke stok warehouse, sehingga belum bisa direfund.'}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEdit ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <Label className="mb-1.5 block text-sm font-medium text-slate-800">Kurang Bayar</Label>
                    <Input readOnly className="h-9 rounded-md border-slate-300 bg-slate-50 text-sm" value={currenciesFormat(currencyCode, lessPayment)} />
                  </div>

                  <div>
                    <Label className="mb-1.5 block text-sm font-medium text-slate-800">QTY</Label>
                    <Input readOnly className="h-9 rounded-md border-slate-300 bg-slate-50 text-sm" value={String(qty)} />
                  </div>

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-medium text-slate-800">Status</FormLabel>
                        <Select
                          value={field.value || 'belum-dibayar'}
                          onValueChange={field.onChange}
                          disabled={isDetail}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 rounded-md border-slate-300 bg-white text-sm">
                              <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lunas">Lunas</SelectItem>
                            <SelectItem value="proses">Proses</SelectItem>
                            <SelectItem value="belum-dibayar">Belum dibayar</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : null}
            </div>

            {/* Note: Buat button HANYA ukuran sm, jangan ngide pake ukuran lainnya */}
            <div className="shrink-0 border-t border-slate-200 bg-slate-50/80 px-6 py-3 flex flex-row items-center justify-end gap-2">
              {isDetail ? (
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  Tutup
                </Button>
              ) : (
                <>
                  <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
                    Batal
                  </Button>
                  <Button type="submit" size="sm" className="bg-[#1F3B5B] hover:bg-[#1B3450] text-white" disabled={isPending}>
                    {isPending ? <LoadingState variant="inline" text={null} /> : null}
                    Simpan
                  </Button>
                </>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}