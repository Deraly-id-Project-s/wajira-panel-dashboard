import { useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import type { GoodsReceipt } from '@/@types/goods-receipt.types';
import type { Supplier } from '@/@types/supplier.types';
import { goodsReceiptSchema, type GoodsReceiptFormValues } from '@/scheme/goods-receipt.schema';

interface GoodsReceiptFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GoodsReceiptFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  initialData?: GoodsReceipt | null;
  suppliers: Supplier[];
  isLoadingSuppliers?: boolean;
  supplierSearch?: string;
  onSupplierSearchChange?: (value: string) => void;
}

const toDateValue = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export function GoodsReceiptFormModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  suppliers,
  isLoadingSuppliers = false,
  supplierSearch = '',
  onSupplierSearchChange,
}: GoodsReceiptFormModalProps) {
  const supplierOptions = useMemo(
    () =>
      suppliers.map((supplier) => ({
        value: String(supplier.id),
        label: supplier.name,
        subtitle: [supplier.code, supplier.phone].filter(Boolean).join(' • '),
      })),
    [suppliers],
  );

  const form = useForm<GoodsReceiptFormValues>({
    resolver: zodResolver(goodsReceiptSchema),
    defaultValues: {
      supplierId: 0,
      transactionDate: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      supplierId: initialData?.supplierId ?? 0,
      transactionDate: initialData?.transactionDate ?? '',
      description: initialData?.description ?? '',
    });
  }, [form, initialData, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="flex max-h-[90dvh] flex-col rounded-md border-none p-0 shadow-2xl sm:max-w-[392px]">
        <div className="shrink-0 px-5 pt-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-[18px] font-semibold text-slate-950">Input Penerimaan Material</DialogTitle>
            <p className="text-sm text-slate-500">Masukkan detail penerimaan material</p>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto px-5 pb-6">
          <form id="goods-receipt-form" onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Kode Pembelian</Label>
              <div className="flex h-10 items-center rounded-[10px] border border-slate-200 px-3 text-[15px] text-slate-400">Auto Generate</div>
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Tanggal Pembelian</Label>
              <Controller
                control={form.control}
                name="transactionDate"
                render={({ field }) => (
                  <DatePicker
                    value={toDateValue(field.value)}
                    onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                    placeholder="Pick a Date"
                    className="h-10 rounded-[10px] border-slate-200 px-3 text-[15px]"
                  />
                )}
              />
              {form.formState.errors.transactionDate ? <p className="text-xs text-red-600">{form.formState.errors.transactionDate.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Nama Supplier</Label>
              <Controller
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? String(field.value) : ''}
                    onChange={(value) => field.onChange(Number(value))}
                    options={supplierOptions}
                    placeholder={isLoadingSuppliers ? 'Memuat supplier...' : 'Masukkan nama supplier'}
                    searchPlaceholder="Cari supplier..."
                    emptyText="Supplier tidak ditemukan."
                    loading={isLoadingSuppliers}
                    onSearchChange={onSupplierSearchChange}
                    className="h-10 rounded-[10px] border-slate-200 bg-white px-3 text-[15px]"
                  />
                )}
              />
              {form.formState.errors.supplierId ? <p className="text-xs text-red-600">{form.formState.errors.supplierId.message}</p> : null}
              {supplierSearch ? <p className="text-xs text-slate-500">Pencarian: {supplierSearch}</p> : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Keterangan</Label>
              <Textarea
                {...form.register('description')}
                rows={4}
                placeholder="Contoh: Barang sudah diterima"
                className="rounded-[10px] border-slate-200 px-3 py-2 text-[15px]"
              />
            </div>

          </form>
        </div>

        <div className="shrink-0 space-y-3 border-t border-slate-100 px-5 pb-6 pt-4">
          <Button type="submit" form="goods-receipt-form" disabled={isSubmitting} className="h-10 rounded-[8px] text-[16px] button-theme-1!">
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-10 w-full rounded-[8px] border-slate-300 text-[16px] font-medium">
            Batal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
