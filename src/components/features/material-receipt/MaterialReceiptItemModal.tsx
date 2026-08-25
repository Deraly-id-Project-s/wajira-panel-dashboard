import { useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import { MoneyInput } from '@/components/ui/money-input';
import { Textarea } from '@/components/ui/textarea';
import type { Material } from '@/@types/material.types';
import type { MaterialTransactionDetailItem } from '@/@types/material-transaction.types';
import { materialTransactionItemSchema, type MaterialTransactionItemFormValues } from '@/scheme/material-transaction.schema';

interface MaterialReceiptItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: MaterialTransactionItemFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  initialData?: MaterialTransactionDetailItem | null;
  materials: Material[];
  isLoadingMaterials?: boolean;
  materialSearch?: string;
  onMaterialSearchChange?: (value: string) => void;
  addTitle?: string;
  editTitle?: string;
  descriptionText?: string;
  orderCodeLabel?: string;
  orderCodePlaceholder?: string;
  priceLabel?: string;
}

export function MaterialReceiptItemModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  materials,
  isLoadingMaterials = false,
  materialSearch = '',
  onMaterialSearchChange,
  addTitle = 'Input Penerimaan Unit',
  editTitle = 'Edit Penerimaan Unit',
  descriptionText = 'Masukkan detail penerimaan unit baru',
  orderCodeLabel = 'Nomor Pembelian',
  orderCodePlaceholder = 'Masukkan nomor pembelian',
  priceLabel = 'Harga Beli',
}: MaterialReceiptItemModalProps) {
  const form = useForm<MaterialTransactionItemFormValues>({
    resolver: zodResolver(materialTransactionItemSchema),
    defaultValues: {
      orderCode: '',
      materialId: 0,
      qty: 0,
      price: 0,
      description: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      orderCode: initialData?.orderCode ?? '',
      materialId: initialData?.materialId ?? 0,
      qty: initialData?.qty ?? 0,
      price: initialData?.price ?? 0,
      description: initialData?.description ?? '',
    });
  }, [open, initialData, form]);

  const materialOptions = useMemo(
    () =>
      materials.map((material) => ({
        value: String(material.id),
        label: material.name,
        subtitle: [material.code, material.type].filter(Boolean).join(' • '),
      })),
    [materials],
  );

  const selectedMaterial = materials.find((material) => material.id === form.watch('materialId'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="rounded-md border-none p-0 shadow-2xl sm:max-w-[402px]">
        <div className="px-6 py-7">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-[18px] font-semibold text-slate-950">
              {initialData ? editTitle : addTitle}
            </DialogTitle>
            <p className="text-sm text-slate-500">{descriptionText}</p>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">{orderCodeLabel}</Label>
              <Input {...form.register('orderCode')} placeholder={orderCodePlaceholder} className="h-12 rounded-md border-slate-200 px-4 text-[15px]" />
              {form.formState.errors.orderCode ? <p className="text-xs text-red-600">{form.formState.errors.orderCode.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Kode Barang</Label>
              <Input value={selectedMaterial?.code ?? ''} readOnly placeholder="Pilih nama barang terlebih dahulu" className="h-12 rounded-md border-slate-200 px-4 text-[15px]" />
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
                    placeholder={isLoadingMaterials ? 'Memuat material...' : 'Pilih nama barang'}
                    searchPlaceholder="Cari material..."
                    emptyText="Material tidak ditemukan."
                    loading={isLoadingMaterials}
                    onSearchChange={onMaterialSearchChange}
                    className="h-12 rounded-md border-slate-200 bg-white px-4 text-[15px]"
                  />
                )}
              />
              {form.formState.errors.materialId ? <p className="text-xs text-red-600">{form.formState.errors.materialId.message}</p> : null}
              {materialSearch ? <p className="text-xs text-slate-500">Pencarian: {materialSearch}</p> : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">{priceLabel}</Label>
              <Controller
                control={form.control}
                name="price"
                render={({ field }) => (
                  <MoneyInput value={field.value} onChangeValue={field.onChange} placeholder="Rp" className="h-12 rounded-md border-slate-200 px-4 text-[15px]" />
                )}
              />
              {form.formState.errors.price ? <p className="text-xs text-red-600">{form.formState.errors.price.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">QTY</Label>
              <Input type="number" min="0" {...form.register('qty', { valueAsNumber: true })} placeholder="0" className="h-12 rounded-md border-slate-200 px-4 text-[15px]" />
              {form.formState.errors.qty ? <p className="text-xs text-red-600">{form.formState.errors.qty.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Keterangan</Label>
              <Textarea {...form.register('description')} rows={3} placeholder="Masukkan keterangan item" className="rounded-md border-slate-200 px-4 py-3 text-[15px]" />
            </div>

            <div className="space-y-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="h-11 rounded-md text-[16px] button-theme-1!">
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 w-full rounded-md border-slate-300 text-[16px] font-medium">
                Batal
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
