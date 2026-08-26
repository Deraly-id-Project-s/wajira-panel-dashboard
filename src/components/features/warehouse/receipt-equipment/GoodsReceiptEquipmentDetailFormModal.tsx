import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import { useVehicleEquipments } from '@/hooks/useVehicleEquipment';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { GoodsTransactionDetailEquipment } from '@/@types/goods-receipt-equipment.types';
import { goodsReceiptEquipmentItemSchema, type GoodsReceiptEquipmentItemFormValues } from '@/scheme/goods-receipt-equipment.schema';

interface GoodsReceiptEquipmentDetailFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GoodsReceiptEquipmentItemFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  initialData?: GoodsTransactionDetailEquipment | null;
}

export function GoodsReceiptEquipmentDetailFormModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
}: GoodsReceiptEquipmentDetailFormModalProps) {
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const debouncedSearch = useDebouncedValue(equipmentSearch, 300);

  const equipmentQuery = useVehicleEquipments({
    search: debouncedSearch || undefined,
    page: 1,
    perPage: 50,
  });

  const equipmentOptions = useMemo(() => {
    const data = equipmentQuery.data?.data ?? [];
    return data.map((eq) => ({
      value: String(eq.id),
      label: eq.name || '',
      subtitle: eq.code ? `Kode: ${eq.code}` : undefined,
    }));
  }, [equipmentQuery.data?.data]);

  const form = useForm<GoodsReceiptEquipmentItemFormValues>({
    resolver: zodResolver(goodsReceiptEquipmentItemSchema),
    defaultValues: {
      vehicleEquipmentId: 0,
      qty: 1,
      price: 0,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      vehicleEquipmentId: initialData?.vehicleEquipmentId ?? 0,
      qty: initialData?.qty ?? 1,
      price: initialData?.price ?? 0,
    });
    setEquipmentSearch('');
  }, [form, initialData, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="rounded-md border-none p-0 shadow-2xl sm:max-w-[392px]">
        <div className="px-5 py-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-[18px] font-semibold text-slate-950">
              {initialData ? 'Edit Detail Perlengkapan' : 'Input Detail Perlengkapan'}
            </DialogTitle>
            <p className="text-sm text-slate-500">Masukkan detail item perlengkapan kendaraan</p>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Perlengkapan</Label>
              <Controller
                control={form.control}
                name="vehicleEquipmentId"
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? String(field.value) : ''}
                    onChange={(value) => field.onChange(Number(value))}
                    options={equipmentOptions}
                    placeholder={equipmentQuery.isLoading ? 'Memuat perlengkapan...' : 'Pilih perlengkapan'}
                    searchPlaceholder="Cari perlengkapan..."
                    emptyText="Perlengkapan tidak ditemukan."
                    loading={equipmentQuery.isLoading}
                    onSearchChange={setEquipmentSearch}
                    className="h-10 rounded-[10px] border-slate-200 bg-white px-3 text-[15px]"
                  />
                )}
              />
              {form.formState.errors.vehicleEquipmentId ? (
                <p className="text-xs text-red-600">{form.formState.errors.vehicleEquipmentId.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Harga Satuan</Label>
              <Controller
                control={form.control}
                name="price"
                render={({ field }) => {
                  const displayValue = field.value ? Number(field.value).toLocaleString('id-ID') : '';

                  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const rawValue = e.target.value.replace(/\D/g, '');
                    const numValue = rawValue ? Number(rawValue) : 0;
                    field.onChange(numValue);
                  };

                  return (
                    <Input
                      type="text"
                      value={displayValue}
                      onChange={handleChange}
                      placeholder="0"
                      className="h-10 rounded-[10px] border-slate-200 bg-white px-3 text-[15px] shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  );
                }}
              />
              {form.formState.errors.price ? (
                <p className="text-xs text-red-600">{form.formState.errors.price.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">QTY</Label>
              <Input
                type="number"
                {...form.register('qty', { valueAsNumber: true })}
                placeholder="0"
                className="h-10 rounded-[10px] border-slate-200 bg-white px-3 text-[15px] shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {form.formState.errors.qty ? (
                <p className="text-xs text-red-600">{form.formState.errors.qty.message}</p>
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
