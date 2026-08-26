'use client';

import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import type { Material } from '@/types/material.types';
import { z } from 'zod';

export const goodsTransactionItemSchema = z.object({
  materialId: z.coerce.number().min(1, 'Material wajib dipilih'),
  qty: z.coerce.number().min(1, 'Jumlah minimal 1'),
  type: z.string().min(1, 'Satuan wajib dipilih'),
  price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  description: z.string().optional(),
});

export type GoodsTransactionItemFormValues = z.infer<typeof goodsTransactionItemSchema>;

export interface GoodsTransactionItemModalProps {
  type: 'receipt' | 'issue';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => Promise<void> | void;
  isSubmitting?: boolean;
  initialData?: any | null;
  materials: Material[];
  isLoadingMaterials?: boolean;
  materialSearch?: string;
  onMaterialSearchChange?: (value: string) => void;
}

export function GoodsTransactionItemModal({
  type,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  materials,
  isLoadingMaterials = false,
  materialSearch = '',
  onMaterialSearchChange,
}: GoodsTransactionItemModalProps) {
  const isReceipt = type === 'receipt';

  const materialOptions = useMemo(
    () =>
      materials.map((material) => ({
        value: String(material.id),
        label: material.name,
        subtitle: [material.code, material.type].filter(Boolean).join(' • '),
      })),
    [materials],
  );

  const form = useForm<GoodsTransactionItemFormValues>({
    resolver: zodResolver(goodsTransactionItemSchema),
    defaultValues: {
      materialId: 0,
      qty: 0,
      type: 'pcs',
      price: 0,
      description: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      materialId: initialData?.materialId ?? 0,
      qty: initialData?.qty ?? 0,
      type: initialData?.type ?? 'pcs',
      price: initialData?.price ?? 0,
      description: initialData?.description ?? '',
    });
  }, [form, initialData, open]);

  const watchedQty = form.watch('qty') || 0;
  const watchedPrice = form.watch('price') || 0;
  const subtotal = watchedQty * watchedPrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="flex max-h-[90dvh] flex-col rounded-md border-none p-0 shadow-2xl sm:max-w-[392px]">
        <div className="shrink-0 px-5 pt-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-[18px] font-semibold text-slate-950">
              {initialData ? 'Edit' : 'Tambah'} Item {isReceipt ? 'Penerimaan' : 'Pengeluaran'}
            </DialogTitle>
            <p className="text-sm text-slate-500">
              Masukkan detail item {isReceipt ? 'penerimaan' : 'pengeluaran'} material
            </p>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto px-5 pb-6">
          <form id="goods-transaction-item-form" onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Nama Material</Label>
              <Controller
                control={form.control}
                name="materialId"
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? String(field.value) : ''}
                    onChange={(value) => {
                      field.onChange(Number(value));
                      const selected = materials.find((m) => String(m.id) === String(value));
                      if (selected) {
                        if (selected.type) form.setValue('type', selected.type);
                        if (!form.getValues('price')) {
                          form.setValue('price', selected.price || 0);
                        }
                      }
                    }}
                    options={materialOptions}
                    placeholder={isLoadingMaterials ? 'Memuat material...' : 'Masukkan nama material'}
                    searchPlaceholder="Cari material..."
                    emptyText="Material tidak ditemukan."
                    loading={isLoadingMaterials}
                    onSearchChange={onMaterialSearchChange}
                    className="h-10 rounded-[10px] border-slate-200 bg-white px-3 text-[15px]"
                  />
                )}
              />
              {form.formState.errors.materialId ? (
                <p className="text-xs text-red-600">{form.formState.errors.materialId.message}</p>
              ) : null}
              {materialSearch ? <p className="text-xs text-slate-500">Pencarian: {materialSearch}</p> : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[15px] font-medium text-slate-900">Jumlah (Qty)</Label>
                <Input
                  type="number"
                  min="1"
                  {...form.register('qty', { valueAsNumber: true })}
                  className="h-10 rounded-[10px] border-slate-200 px-3 text-[15px]"
                />
                {form.formState.errors.qty ? (
                  <p className="text-xs text-red-600">{form.formState.errors.qty.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-[15px] font-medium text-slate-900">Satuan</Label>
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 rounded-[10px] border-slate-200 px-3 text-[15px]">
                        <SelectValue placeholder="Pilih Satuan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">Pcs</SelectItem>
                        <SelectItem value="unit">Unit</SelectItem>
                        <SelectItem value="set">Set</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="roll">Roll</SelectItem>
                        <SelectItem value="meter">Meter</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="liter">Liter</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Harga Satuan</Label>
              <Controller
                control={form.control}
                name="price"
                render={({ field }) => (
                  <MoneyInput
                    value={field.value}
                    onChangeValue={(val: number) => field.onChange(val || 0)}
                    className="h-10 rounded-[10px] border-slate-200 px-3 text-[15px]"
                  />
                )}
              />
              {form.formState.errors.price ? (
                <p className="text-xs text-red-600">{form.formState.errors.price.message}</p>
              ) : null}
            </div>

            <div className="rounded-[10px] border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-900">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(subtotal)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Keterangan</Label>
              <Textarea
                {...form.register('description')}
                rows={3}
                placeholder="Keterangan item (opsional)"
                className="rounded-[10px] border-slate-200 px-3 py-2 text-[15px]"
              />
            </div>
          </form>
        </div>

        <div className="shrink-0 space-y-3 border-t border-slate-100 px-5 pb-6 pt-4">
          <Button
            type="submit"
            form="goods-transaction-item-form"
            disabled={isSubmitting}
            className="h-10 w-full rounded-[8px] bg-[#1f4163] text-[16px] font-medium hover:bg-[#183552]"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
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
