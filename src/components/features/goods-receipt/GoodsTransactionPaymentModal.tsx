'use client';

import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import type { Kas } from '@/types/kas.types';
import { z } from 'zod';

export const goodsTransactionPaymentSchema = z.object({
  cashId: z.coerce.number().min(1, 'Kas wajib dipilih'),
  amount: z.coerce.number().min(1, 'Nominal pembayaran harus lebih dari 0'),
  transactionDate: z.string().min(1, 'Tanggal pembayaran wajib diisi'),
  description: z.string().optional(),
});

export type GoodsTransactionPaymentFormValues = z.infer<typeof goodsTransactionPaymentSchema>;

export interface GoodsTransactionPaymentModalProps {
  type: 'receipt' | 'issue';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => Promise<void> | void;
  isSubmitting?: boolean;
  transaction: any;
  totalAmount: number;
  cashes: Kas[];
  isLoadingCashes?: boolean;
}

const toDateValue = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export function GoodsTransactionPaymentModal({
  type,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  transaction,
  totalAmount,
  cashes,
  isLoadingCashes = false,
}: GoodsTransactionPaymentModalProps) {
  const isReceipt = type === 'receipt';

  const cashOptions = useMemo(
    () =>
      cashes.map((cash) => ({
        value: String(cash.id),
        label: `${cash.cash_name || cash.description || 'Kas'} (${cash.code})`,
        subtitle: [cash.code, cash.description].filter(Boolean).join(' • '),
      })),
    [cashes],
  );

  const form = useForm<GoodsTransactionPaymentFormValues>({
    resolver: zodResolver(goodsTransactionPaymentSchema),
    defaultValues: {
      cashId: 0,
      amount: totalAmount,
      transactionDate: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      cashId: cashOptions[0] ? Number(cashOptions[0].value) : 0,
      amount: totalAmount,
      transactionDate: new Date().toISOString().split('T')[0],
      description: '',
    });
  }, [form, totalAmount, cashOptions, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="flex max-h-[90dvh] flex-col rounded-md border-none p-0 shadow-2xl sm:max-w-[392px]">
        <div className="shrink-0 px-5 pt-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-[18px] font-semibold text-slate-950">
              Input Pembayaran {isReceipt ? 'Penerimaan' : 'Pengeluaran'}
            </DialogTitle>
            <p className="text-sm text-slate-500">
              Masukkan detail pembayaran {isReceipt ? 'penerimaan' : 'pengeluaran'} material
            </p>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto px-5 pb-6">
          <form id="goods-transaction-payment-form" onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Kas</Label>
              <Controller
                control={form.control}
                name="cashId"
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? String(field.value) : ''}
                    onChange={(value) => field.onChange(Number(value))}
                    options={cashOptions}
                    placeholder={isLoadingCashes ? 'Memuat kas...' : 'Pilih kas'}
                    searchPlaceholder="Cari kas..."
                    emptyText="Kas tidak ditemukan."
                    loading={isLoadingCashes}
                    className="h-10 rounded-[10px] border-slate-200 bg-white px-3 text-[15px]"
                  />
                )}
              />
              {form.formState.errors.cashId ? (
                <p className="text-xs text-red-600">{form.formState.errors.cashId.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Nominal Pembayaran</Label>
              <Controller
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <MoneyInput
                    value={field.value}
                    onChangeValue={(val: number) => field.onChange(val || 0)}
                    className="h-10 rounded-[10px] border-slate-200 px-3 text-[15px]"
                  />
                )}
              />
              {form.formState.errors.amount ? (
                <p className="text-xs text-red-600">{form.formState.errors.amount.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Tanggal Pembayaran</Label>
              <Controller
                control={form.control}
                name="transactionDate"
                render={({ field }) => (
                  <DatePicker
                    value={toDateValue(field.value)}
                    onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                    placeholder="Pilih Tanggal"
                    className="h-10 rounded-[10px] border-slate-200 px-3 text-[15px]"
                  />
                )}
              />
              {form.formState.errors.transactionDate ? (
                <p className="text-xs text-red-600">{form.formState.errors.transactionDate.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Keterangan</Label>
              <Textarea
                {...form.register('description')}
                rows={3}
                placeholder="Keterangan pembayaran (opsional)"
                className="rounded-[10px] border-slate-200 px-3 py-2 text-[15px]"
              />
            </div>
          </form>
        </div>

        <div className="shrink-0 space-y-3 border-t border-slate-100 px-5 pb-6 pt-4">
          <Button
            type="submit"
            form="goods-transaction-payment-form"
            disabled={isSubmitting}
            className="h-10 w-full rounded-[8px] bg-[#1f4163] text-[16px] font-medium hover:bg-[#183552]"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 w-full rounded-[8px] border-slate-300 text-[16px] font-medium"
          >
            Batal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
