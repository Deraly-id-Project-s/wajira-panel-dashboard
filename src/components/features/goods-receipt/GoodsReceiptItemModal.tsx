import { useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
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
import type { GoodsReceiptItem } from '@/@types/goods-receipt.types';
import type { Material } from '@/@types/material.types';
import { goodsReceiptItemSchema, type GoodsReceiptItemFormValues } from '@/scheme/goods-receipt.schema';
import { formatCurrency } from './goods-receipt.utils';

interface GoodsReceiptItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GoodsReceiptItemFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  initialData?: GoodsReceiptItem | null;
  materials: Material[];
  isLoadingMaterials?: boolean;
  materialSearch?: string;
  onMaterialSearchChange?: (value: string) => void;
}

export function GoodsReceiptItemModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  materials,
  isLoadingMaterials = false,
  materialSearch = '',
  onMaterialSearchChange,
}: GoodsReceiptItemModalProps) {
  const materialOptions = useMemo(
    () =>
      materials.map((material) => ({
        value: String(material.id),
        label: material.name,
        subtitle: [material.code, material.type].filter(Boolean).join(' • '),
      })),
    [materials],
  );

  const form = useForm<GoodsReceiptItemFormValues>({
    resolver: zodResolver(goodsReceiptItemSchema),
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

  const qty = form.watch('qty');
  const price = form.watch('price');
  const total = Number(qty || 0) * Number(price || 0);
  const selectedMaterial = materials.find((item) => item.id === form.watch('materialId'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="flex max-h-[90dvh] flex-col rounded-md border-none p-0 shadow-2xl sm:max-w-[398px]">
        <div className="shrink-0 px-6 pt-7">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-[18px] font-semibold text-slate-950">Input Penerimaan Material</DialogTitle>
            <p className="text-sm text-slate-500">Masukkan detail penerimaan material</p>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto px-6 pb-7">
          <form id="goods-receipt-item-form" onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Kode Barang</Label>
              <Input value={selectedMaterial?.code ?? ''} readOnly placeholder="Masukkan kode barang" className="h-10 rounded-[10px] border-slate-200 px-3 text-[15px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Nama Barang</Label>
              <Controller
                control={form.control}
                name="materialId"
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? String(field.value) : ''}
                    onChange={(value) => field.onChange(Number(value))}
                    options={materialOptions}
                    placeholder={isLoadingMaterials ? 'Memuat material...' : 'Masukkan nama barang'}
                    searchPlaceholder="Cari material..."
                    emptyText="Material tidak ditemukan."
                    loading={isLoadingMaterials}
                    onSearchChange={onMaterialSearchChange}
                    className="h-10 rounded-[10px] border-slate-200 bg-white px-3 text-[15px]"
                  />
                )}
              />
              {form.formState.errors.materialId ? <p className="text-xs text-red-600">{form.formState.errors.materialId.message}</p> : null}
              {materialSearch ? <p className="text-xs text-slate-500">Pencarian: {materialSearch}</p> : null}
            </div>
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">QTY</Label>
              <Input type="number" min="0" {...form.register('qty', { valueAsNumber: true })} placeholder="Masukkan quantity" className="h-10 rounded-[10px] border-slate-200 px-3 text-[15px]" />
              {form.formState.errors.qty ? <p className="text-xs text-red-600">{form.formState.errors.qty.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Satuan</Label>
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10 rounded-[10px] border-slate-200 px-3 text-[15px]">
                      <SelectValue placeholder="Contoh: PCS" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">PCS</SelectItem>
                      <SelectItem value="set">SET</SelectItem>
                      <SelectItem value="box">BOX</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.type ? <p className="text-xs text-red-600">{form.formState.errors.type.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Harga Satuan</Label>
              <Controller
                control={form.control}
                name="price"
                render={({ field }) => (
                  <MoneyInput value={field.value} onChangeValue={field.onChange} placeholder="Rp" className="h-10 rounded-[10px] border-slate-200 px-3 text-[15px]" />
                )}
              />
              {form.formState.errors.price ? <p className="text-xs text-red-600">{form.formState.errors.price.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Total</Label>
              <Input value={formatCurrency(total)} readOnly className="h-10 rounded-[10px] border-slate-200 px-3 text-[15px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Keterangan</Label>
              <Textarea {...form.register('description')} rows={3} placeholder="Keterangan item" className="rounded-[10px] border-slate-200 px-3 py-2 text-[15px]" />
            </div>

          </form>
        </div>

        <div className="shrink-0 space-y-3 border-t border-slate-100 px-6 pb-7 pt-4">
          <Button type="submit" form="goods-receipt-item-form" disabled={isSubmitting} className="h-10 w-full rounded-[8px] bg-[#1f4163] text-[16px] font-medium hover:bg-[#183552]">
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
