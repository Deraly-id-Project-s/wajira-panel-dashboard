import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import { useSuppliers } from '@/hooks/useSupplier';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { GoodsReceiptEquipment } from '@/@types/goods-receipt-equipment.types';
import { goodsReceiptEquipmentSchema, type GoodsReceiptEquipmentFormValues } from '@/scheme/goods-receipt-equipment.schema';

interface GoodsReceiptEquipmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GoodsReceiptEquipmentFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  initialData?: GoodsReceiptEquipment | null;
  companyId?: number | string;
}

const toDateValue = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export function GoodsReceiptEquipmentFormModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  companyId = 4,
}: GoodsReceiptEquipmentFormModalProps) {
  const [supplierSearch, setSupplierSearch] = useState('');
  const debouncedSupplierSearch = useDebouncedValue(supplierSearch, 300);

  const suppliersQuery = useSuppliers(String(companyId));

  const supplierOptions = useMemo(() => {
    const data = suppliersQuery.data?.data ?? [];
    const filtered = debouncedSupplierSearch
      ? data.filter(
        (sup) =>
          sup.name.toLowerCase().includes(debouncedSupplierSearch.toLowerCase()) ||
          (sup.code && sup.code.toLowerCase().includes(debouncedSupplierSearch.toLowerCase())),
      )
      : data;

    return filtered.map((sup) => ({
      value: String(sup.id),
      label: sup.name || '',
      subtitle: sup.code ? `Kode: ${sup.code}` : undefined,
    }));
  }, [suppliersQuery.data?.data, debouncedSupplierSearch]);

  const form = useForm<GoodsReceiptEquipmentFormValues>({
    resolver: zodResolver(goodsReceiptEquipmentSchema),
    defaultValues: {
      supplierId: 0,
      transactionDate: '',
      location: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      supplierId: initialData?.supplierId ?? 0,
      transactionDate: initialData?.transactionDate ?? '',
      location: initialData?.location ?? '',
      description: initialData?.description ?? '',
    });
    setSupplierSearch('');
  }, [form, initialData, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="rounded-md border-none p-0 shadow-2xl sm:max-w-[440px]">
        <div className="px-6 py-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-[18px] font-semibold text-slate-950">
              {initialData ? 'Edit Penerimaan Perlengkapan' : 'Input Penerimaan Perlengkapan'}
            </DialogTitle>
            <p className="text-sm text-slate-500">Masukkan detail penerimaan perlengkapan kendaraan</p>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Kode Penerimaan</Label>
              <div className="flex h-10 items-center rounded-[10px] border border-slate-200 bg-slate-50 px-3 text-[15px] text-slate-400">
                {initialData?.code || 'Auto Generate'}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Tanggal Penerimaan</Label>
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
              {form.formState.errors.transactionDate ? (
                <p className="text-xs text-red-600">{form.formState.errors.transactionDate.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Supplier</Label>
              <Controller
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? String(field.value) : ''}
                    onChange={(value) => field.onChange(Number(value))}
                    options={supplierOptions}
                    placeholder={suppliersQuery.isLoading ? 'Memuat supplier...' : 'Masukkan nama supplier'}
                    searchPlaceholder="Cari supplier..."
                    emptyText="Supplier tidak ditemukan."
                    loading={suppliersQuery.isLoading}
                    onSearchChange={setSupplierSearch}
                    className="h-10 rounded-[10px] border-slate-200 px-3 text-[15px]"
                  />
                )}
              />
              {form.formState.errors.supplierId ? (
                <p className="text-xs text-red-600">{form.formState.errors.supplierId.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Lokasi</Label>
              <Input
                {...form.register('location')}
                placeholder="Masukkan lokasi penerimaan"
                className="h-10 rounded-[10px] border-slate-200 px-3 text-[15px] shadow-none"
              />
              {form.formState.errors.location ? (
                <p className="text-xs text-red-600">{form.formState.errors.location.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Keterangan</Label>
              <Textarea
                {...form.register('description')}
                placeholder="Tambahkan keterangan jika perlu"
                className="min-h-[80px] rounded-[10px] border-slate-200 px-3 py-2 text-[15px] shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {form.formState.errors.description ? (
                <p className="text-xs text-red-600">{form.formState.errors.description.message}</p>
              ) : null}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 rounded-[10px] border-slate-200 px-5 text-[15px]"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 rounded-[10px] bg-[#1f4163] px-5 text-[15px] hover:bg-[#183552]"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
