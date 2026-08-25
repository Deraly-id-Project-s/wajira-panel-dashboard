import { useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import type { Material } from '@/@types/material.types';
import type { MaterialTransaction, MaterialTransactionDetailItem } from '@/@types/material-transaction.types';
import { materialTransactionItemSchema, type MaterialTransactionItemFormValues } from '@/scheme/material-transaction.schema';

interface PurchaseMaterialDetailItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: MaterialTransactionItemFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  initialData?: MaterialTransactionDetailItem | null;
  transaction: MaterialTransaction;
  materials: Material[];
  isLoadingMaterials?: boolean;
  materialSearch?: string;
  onMaterialSearchChange?: (value: string) => void;
  addTitle?: string;
  editTitle?: string;
  codeLabel?: string;
  counterpartyLabel?: string;
  materialLabel?: string;
  qtyLabel?: string;
  priceLabel?: string;
  subtotalLabel?: string;
}

export function PurchaseMaterialDetailItemModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  transaction,
  materials,
  isLoadingMaterials = false,
  materialSearch = '',
  onMaterialSearchChange,
  addTitle = 'Tambah Data Beli',
  editTitle = 'Edit Data Beli',
  codeLabel = 'Kode Pembelian',
  counterpartyLabel = 'Nama Supplier',
  materialLabel = 'Nama Material',
  qtyLabel = 'QTY',
  priceLabel = 'Harga Beli',
  subtotalLabel = 'Sub Total Beli',
}: PurchaseMaterialDetailItemModalProps) {
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

  const qty = form.watch('qty');
  const price = form.watch('price');
  const subtotal = Number(qty || 0) * Number(price || 0);
  const materialOptions = useMemo(
    () =>
      materials.map((material) => ({
        value: String(material.id),
        label: material.name,
        subtitle: [material.code, material.type].filter(Boolean).join(' • '),
      })),
    [materials],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-hidden rounded-md border border-slate-200 px-0 py-0 sm:max-w-[460px]">
        <div className="overflow-y-auto px-6 py-7">
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-[20px] font-semibold text-slate-900">
              {initialData ? editTitle : addTitle}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-5">
            <div className="space-y-2.5">
              <Label className="text-[16px] font-medium text-slate-900">{codeLabel}</Label>
              <Input value={transaction.code} readOnly className="h-12 rounded-md border-slate-200 px-4 text-[16px] text-slate-500 shadow-sm" />
            </div>

            <div className="space-y-2.5">
              <Label className="text-[16px] font-medium text-slate-900">Nomor Pembelian</Label>
              <Input
                {...form.register('orderCode')}
                placeholder="Masukkan nomor pembelian"
                className="h-12 rounded-md border-slate-200 px-4 text-[16px] shadow-sm"
              />
              {form.formState.errors.orderCode ? <p className="text-sm text-red-600">{form.formState.errors.orderCode.message}</p> : null}
            </div>

            <div className="space-y-2.5">
              <Label className="text-[16px] font-medium text-slate-900">{counterpartyLabel}</Label>
              <Input value={transaction.supplierName} readOnly className="h-12 rounded-md border-slate-200 px-4 text-[16px] text-slate-500 shadow-sm" />
            </div>

            <div className="space-y-2.5">
              <Label className="text-[16px] font-medium text-slate-900">{materialLabel}</Label>
              <Controller
                control={form.control}
                name="materialId"
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? String(field.value) : ''}
                    onChange={(value) => field.onChange(Number(value))}
                    options={materialOptions}
                    placeholder={isLoadingMaterials ? 'Memuat material...' : 'Pilih material'}
                    searchPlaceholder="Cari material..."
                    emptyText="Material tidak ditemukan."
                    loading={isLoadingMaterials}
                    onSearchChange={onMaterialSearchChange}
                    className="h-12 rounded-md border-slate-200 px-4 text-[16px] shadow-sm"
                  />
                )}
              />
              {form.formState.errors.materialId ? <p className="text-sm text-red-600">{form.formState.errors.materialId.message}</p> : null}
              {!isLoadingMaterials && materialOptions.length > 0 && materialSearch ? <p className="text-xs text-slate-500">Pencarian: {materialSearch}</p> : null}
            </div>

            <div className="space-y-2.5">
              <Label className="text-[16px] font-medium text-slate-900">{qtyLabel}</Label>
              <Input
                type="number"
                min="0"
                {...form.register('qty', { valueAsNumber: true })}
                className="h-12 rounded-md border-slate-200 px-4 text-[16px] shadow-sm"
              />
              {form.formState.errors.qty ? <p className="text-sm text-red-600">{form.formState.errors.qty.message}</p> : null}
            </div>

            <div className="space-y-2.5">
              <Label className="text-[16px] font-medium text-slate-900">{priceLabel}</Label>
              <Controller
                control={form.control}
                name="price"
                render={({ field }) => (
                  <MoneyInput
                    value={field.value}
                    onChangeValue={field.onChange}
                    placeholder="Masukkan harga beli"
                    className="h-12 rounded-md border-slate-200 px-4 text-[16px] shadow-sm"
                  />
                )}
              />
              {form.formState.errors.price ? <p className="text-sm text-red-600">{form.formState.errors.price.message}</p> : null}
            </div>

            <div className="space-y-2.5">
              <Label className="text-[16px] font-medium text-slate-900">{subtotalLabel}</Label>
              <Input
                value={`Rp${subtotal.toLocaleString('id-ID')}`}
                readOnly
                className="h-12 rounded-md border-slate-200 px-4 text-[16px] text-slate-500 shadow-sm"
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="h-11 rounded-md text-[16px] button-theme-1!">
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 rounded-md border-slate-300 text-[16px] font-medium">
                Batal
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
