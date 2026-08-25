import { useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import type { GoodsReceiptEquipment } from '@/@types/goods-receipt-equipment.types';
import type { Kas } from '@/@types/kas.types';
import { goodsReceiptEquipmentPaymentSchema, type GoodsReceiptEquipmentPaymentFormValues } from '@/scheme/goods-receipt-equipment.schema';
import { formatCurrency, getPaymentMethodLabel } from './goodsReceiptEquipment.utils';

interface GoodsReceiptEquipmentPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GoodsReceiptEquipmentPaymentFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  transaction: GoodsReceiptEquipment;
  totalAmount: number;
  cashes: Kas[];
  isLoadingCashes?: boolean;
}

const toDateValue = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export function GoodsReceiptEquipmentPaymentModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  transaction,
  totalAmount,
  cashes,
  isLoadingCashes = false,
}: GoodsReceiptEquipmentPaymentModalProps) {
  const cashOptions = useMemo(
    () =>
      cashes.map((cash) => ({
        value: String(cash.id),
        label: getPaymentMethodLabel(cash),
        subtitle: [cash.code, cash.description].filter(Boolean).join(' • '),
      })),
    [cashes],
  );

  const form = useForm<GoodsReceiptEquipmentPaymentFormValues>({
    resolver: zodResolver(goodsReceiptEquipmentPaymentSchema),
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
      transactionDate: '',
      description: '',
    });
  }, [cashOptions, form, open, totalAmount]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="rounded-[20px] border-none p-0 shadow-2xl sm:max-w-[420px]">
        <div className="px-6 py-7">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-[18px] font-semibold text-slate-950">Pembayaran Pembelian</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Kode Pembelian</Label>
              <Input value={transaction.code} readOnly className="h-10 rounded-[10px] border-slate-200 px-3 text-[15px] text-slate-400" />
            </div>
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Tanggal Bayar</Label>
              <Controller
                control={form.control}
                name="transactionDate"
                render={({ field }) => (
                  <DatePicker
                    value={toDateValue(field.value)}
                    onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                    placeholder="Pick a date"
                    className="h-10 rounded-[10px] border-slate-200 px-3 text-[15px]"
                  />
                )}
              />
              {form.formState.errors.transactionDate ? <p className="text-xs text-red-600">{form.formState.errors.transactionDate.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Nama Supplier</Label>
              <Input value={transaction.supplier?.name ?? '-'} readOnly className="h-10 rounded-[10px] border-slate-200 px-3 text-[15px] text-slate-400" />
            </div>
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Total Bayar</Label>
              <Controller
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <MoneyInput value={field.value} onChangeValue={field.onChange} placeholder="Rp" className="h-10 rounded-[10px] border-slate-200 px-3 text-[15px]" />
                )}
              />
              <p className="text-xs text-slate-500">Tagihan saat ini: {formatCurrency(totalAmount)}</p>
              {form.formState.errors.amount ? <p className="text-xs text-red-600">{form.formState.errors.amount.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Pembayaran</Label>
              <Controller
                control={form.control}
                name="cashId"
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? String(field.value) : ''}
                    onChange={(value) => field.onChange(Number(value))}
                    options={cashOptions}
                    placeholder={isLoadingCashes ? 'Memuat pembayaran...' : 'Pilih metode pembayaran'}
                    searchPlaceholder="Cari pembayaran..."
                    emptyText="Pembayaran tidak ditemukan."
                    loading={isLoadingCashes}
                    className="h-10 rounded-[10px] border-slate-200 bg-white px-3 text-[15px]"
                  />
                )}
              />
              {form.formState.errors.cashId ? <p className="text-xs text-red-600">{form.formState.errors.cashId.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Keterangan</Label>
              <Textarea {...form.register('description')} rows={4} placeholder="Tulis keterangan pembayaran di sini." className="rounded-[10px] border-slate-200 px-3 py-2 text-[15px]" />
            </div>
            <div className="space-y-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="h-10 rounded-[8px] text-[16px] button-theme-1!">
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-10 w-full rounded-[8px] border-slate-300 text-[16px] font-medium">
                Batal
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
