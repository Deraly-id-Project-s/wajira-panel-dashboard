'use client';


import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Save, Search } from 'lucide-react';
import { UnitTransactionDetail, UnitTransactionItemDetail } from '@/@types/unit-transaction.types';
import { Kas } from '@/@types/kas.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils/currency';
import { LoadingState } from '@/components/ui/loading-state';

// ─── Schema ───────────────────────────────────────────────────────────────────

const refundSchema = z.object({
  cashId: z.string().min(1, 'Kas wajib dipilih'),
  refundDate: z.date({ required_error: 'Tanggal refund wajib diisi' }),
  description: z.string().min(1, 'Catatan refund wajib diisi').max(500, 'Maksimal 500 karakter'),
});

export type PurchaseRefundFormValues = z.infer<typeof refundSchema> & {
  selectedDetailIds: string[];
  nominalRefund: number;
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  purchase: UnitTransactionDetail;
  totalPaid: number;
  unitItemDetails: UnitTransactionItemDetail[];
  unitItemDetailsLoading?: boolean;
  cashOptions: Kas[];
  submitting?: boolean;
  disabled?: boolean;
  onCancel: () => void;
  onSubmit: (values: PurchaseRefundFormValues) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PurchaseRefundForm({
  purchase,
  totalPaid,
  unitItemDetails,
  unitItemDetailsLoading = false,
  cashOptions,
  submitting = false,
  disabled = false,
  onCancel,
  onSubmit,
}: Props) {
  const totalPurchase = Number(
    purchase.unit_transaction_bruto_total ?? purchase.unit_transaction_item_bruto_total ?? 0,
  );

  // Selected unit detail ids
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Auto-calc nominal refund from selected rows
  const nominalRefund = useMemo(() => {
    return unitItemDetails
      .filter((d) => selectedIds.has(d.id))
      .reduce((sum, d) => sum + (d.price ?? 0), 0);
  }, [unitItemDetails, selectedIds]);

  const form = useForm<z.infer<typeof refundSchema>>({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      cashId: '',
      refundDate: new Date(),
      description: '',
    },
  });

  // Auto-select kas if only one available
  useEffect(() => {
    if (cashOptions.length === 1 && cashOptions[0]) {
      form.setValue('cashId', String(cashOptions[0].id));
    }
  }, [cashOptions, form]);

  // ── Checkbox helpers ──────────────────────────────────────────────────────

  const isRefundedItem = (d: UnitTransactionItemDetail) => {
    return d.status?.toLowerCase() === 'refunded' || d.status?.toLowerCase() === 'returned';
  };

  const sortedUnitItemDetails = useMemo(() => {
    return [...unitItemDetails].sort((a, b) => {
      const aRefunded = isRefundedItem(a);
      const bRefunded = isRefundedItem(b);
      if (aRefunded && !bRefunded) return -1;
      if (!aRefunded && bRefunded) return 1;
      return 0;
    });
  }, [unitItemDetails]);

  const availableIds = unitItemDetails.filter((d) => !isRefundedItem(d)).map((d) => d.id);
  const allSelected = availableIds.length > 0 && availableIds.every((id) => selectedIds.has(id));
  const someSelected = availableIds.some((id) => selectedIds.has(id));

  const toggleAll = () => {
    if (disabled) return;
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availableIds));
    }
  };

  const toggleOne = (id: string) => {
    if (disabled) return;
    // Do not toggle if the item is already refunded
    const detail = unitItemDetails.find((d) => d.id === id);
    if (detail && isRefundedItem(detail)) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleFormSubmit = async (values: z.infer<typeof refundSchema>) => {
    await onSubmit({
      ...values,
      selectedDetailIds: Array.from(selectedIds),
      nominalRefund,
    });
  };

  const isCashEmpty = cashOptions.length === 0;
  const isFormDisabled = disabled || submitting;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Card className="rounded-md border border-gray-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <CardContent className="p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Informasi Pembelian</h2>
              <Button type="button" className="btn-primary!">
                <Plus className="mr-1.5 h-4 w-4" />
                Tambah
              </Button>
            </div>

            <div className="h-px bg-gray-100" />

            {/* ── Row 1: Kode Pembelian | Supplier | Tanggal Refund ── */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {/* Kode Pembelian */}
              <div className="space-y-2">
                <FormLabel className="text-sm font-medium text-slate-700">Kode Pembelian</FormLabel>
                <Input
                  value={purchase.code}
                  readOnly
                  className="h-11 rounded-md border-gray-200 bg-gray-50 text-slate-600 shadow-none focus-visible:ring-0"
                />
              </div>

              {/* Supplier */}
              <div className="space-y-2">
                <FormLabel className="text-sm font-medium text-slate-700">Supplier</FormLabel>
                <Input
                  value={purchase.person?.name ?? '-'}
                  readOnly
                  className="h-11 rounded-md border-gray-200 bg-gray-50 text-slate-600 shadow-none focus-visible:ring-0"
                />
              </div>

              {/* Tanggal Refund */}
              <FormField
                control={form.control}
                name="refundDate"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-slate-700">Tanggal Refund</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value ?? null}
                        onChange={field.onChange}
                        placeholder="Pilih tanggal"
                        className="h-11 rounded-md border-gray-200 bg-white text-slate-900 shadow-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Row 2: Total Pembelian | Telah Dibayar ── */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <FormLabel className="text-sm font-medium text-slate-700">Total Pembelian</FormLabel>
                <Input
                  value={formatCurrency(totalPurchase)}
                  readOnly
                  className="h-11 rounded-md border-gray-200 bg-gray-50 text-slate-600 shadow-none focus-visible:ring-0"
                />
              </div>

              <div className="space-y-2">
                <FormLabel className="text-sm font-medium text-slate-700">Telah Dibayar</FormLabel>
                <Input
                  value={formatCurrency(totalPaid)}
                  readOnly
                  className="h-11 rounded-md border-gray-200 bg-gray-50 text-slate-600 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>

            {/* ── Row 3: Kas + Nominal Refund ── */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Kas */}
              <FormField
                control={form.control}
                name="cashId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-slate-700">Kas Penerimaan Refund</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isCashEmpty || isFormDisabled}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-md border-gray-200 bg-white text-slate-900 shadow-none">
                          <SelectValue placeholder={isCashEmpty ? 'Kas tidak tersedia' : 'Pilih Kas'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cashOptions.map((cash) => (
                          <SelectItem key={cash.id} value={String(cash.id)}>
                            {cash.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nominal Refund (auto) */}
              <div className="space-y-2">
                <FormLabel className="text-sm font-medium text-slate-700">Nominal Refund</FormLabel>
                <Input
                  value={formatCurrency(nominalRefund)}
                  readOnly
                  className="h-11 rounded-md border-gray-200 bg-gray-50 text-slate-600 shadow-none focus-visible:ring-0"
                  placeholder="Rp 0"
                />
                {selectedIds.size === 0 && (
                  <p className="text-xs text-slate-400">Pilih unit di tabel untuk menghitung nominal</p>
                )}
              </div>
            </div>

            {/* ── Tabel Unit Item Detail ── */}
            <div className="overflow-x-auto rounded-md border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f8fafc] hover:bg-[#f8fafc]">
                    <TableHead className="w-10 py-3 pl-4">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Pilih semua unit"
                        className="rounded border-gray-300"
                        disabled={isFormDisabled}
                        data-state={someSelected && !allSelected ? 'indeterminate' : undefined}
                      />
                    </TableHead>
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Tipe Unit
                    </TableHead>
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Warna
                    </TableHead>
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Nomor Mesin
                    </TableHead>
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Nomor Rangka
                    </TableHead>
                    <TableHead className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 pr-4">
                      Harga
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unitItemDetailsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-400">
                          <LoadingState variant="inline" text={null} />
                          <span className="text-sm">Memuat data unit...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : unitItemDetails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={100} className="py-16 text-center text-sm text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="rounded-full bg-slate-50 p-4 mb-2">
                            <Search className="h-8 w-8 text-slate-400" />
                          </div>
                          <p className="text-base font-semibold text-slate-900">Tidak ada data ditemukan</p>
                          <p className="text-sm text-slate-500">Belum ada data atau coba gunakan kata kunci pencarian lain.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedUnitItemDetails.map((detail) => {
                      const alreadyRefunded = isRefundedItem(detail);
                      const isChecked = alreadyRefunded || selectedIds.has(detail.id);
                      const isRowDisabled = isFormDisabled || alreadyRefunded;
                      return (
                        <TableRow
                          key={detail.id}
                          className={`cursor-pointer transition-colors ${isChecked ? (alreadyRefunded ? 'bg-amber-50/50 hover:bg-amber-50/50' : 'bg-blue-50 hover:bg-blue-50') : 'hover:bg-slate-50'}`}
                          onClick={() => !isRowDisabled && toggleOne(detail.id)}
                        >
                          <TableCell className="pl-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => !alreadyRefunded && toggleOne(detail.id)}
                              aria-label={`Pilih unit ${detail.machine_number}`}
                              className="rounded border-gray-300"
                              disabled={isRowDisabled}
                            />
                          </TableCell>
                          <TableCell className="py-3 text-sm font-medium text-slate-800">
                            <div className="flex flex-col gap-1">
                              <span>{detail.unit_type_name ?? '-'}</span>
                              {alreadyRefunded && (
                                <span className="inline-flex w-fit items-center rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                  Sudah Direfund
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-sm text-slate-600">{detail.color}</TableCell>
                          <TableCell className="py-3 text-sm text-slate-600 font-mono">{detail.machine_number}</TableCell>
                          <TableCell className="py-3 text-sm text-slate-600 font-mono">{detail.chassis_number}</TableCell>
                          <TableCell className="py-3 text-right text-sm text-slate-700 pr-4">
                            {detail.price !== undefined ? formatCurrency(detail.price) : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* ── Catatan Refund ── */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium text-slate-700">Catatan Refund</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: Dikembalikan karena ada kecacatan"
                      className="min-h-[100px] rounded-md border-gray-200 bg-white px-3 py-2.5 text-slate-900 shadow-none placeholder:text-slate-400"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Actions ── */}
            <div className="flex items-center justify-center gap-6 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={submitting}
                className="h-11 px-6 text-sm font-medium text-slate-600 hover:bg-transparent hover:text-slate-900"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isFormDisabled || selectedIds.size === 0}
                className="h-11 min-w-[120px] rounded-md bg-[#284d74] px-6 text-sm font-medium text-white shadow-none hover:bg-[#1f3f5f] disabled:opacity-50"
              >
                <Save className="mr-2 h-4 w-4" />
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
