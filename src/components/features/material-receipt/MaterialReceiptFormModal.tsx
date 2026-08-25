import { useEffect } from 'react';
import { Search } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import type { MaterialTransaction } from '@/@types/material-transaction.types';
import type { WarehouseOption } from '@/@types/pengeluaran-unit.types';
import { materialTransactionSchema, type MaterialTransactionFormValues } from '@/scheme/material-transaction.schema';

interface MaterialReceiptFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: MaterialTransactionFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  initialData?: MaterialTransaction | null;
  warehouses: WarehouseOption[];
  isLoadingWarehouses?: boolean;
  addTitle?: string;
  editTitle?: string;
  descriptionText?: string;
  dateLabel?: string;
  descriptionPlaceholder?: string;
}

const toDateValue = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export function MaterialReceiptFormModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  warehouses,
  isLoadingWarehouses = false,
  addTitle = 'Input Penerimaan Unit',
  editTitle = 'Edit Penerimaan Perlengkapan',
  descriptionText = 'Masukkan detail penerimaan unit baru',
  dateLabel = 'Tanggal Penerimaan',
  descriptionPlaceholder = 'Masukkan keterangan penerimaan',
}: MaterialReceiptFormModalProps) {
  const form = useForm<MaterialTransactionFormValues>({
    resolver: zodResolver(materialTransactionSchema),
    defaultValues: {
      warehouseId: 0,
      supplierName: '',
      transactionDate: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      warehouseId: initialData?.warehouseId ?? 0,
      supplierName: initialData?.supplierName ?? '',
      transactionDate: initialData?.transactionDate ?? '',
      description: initialData?.description ?? '',
    });
  }, [open, initialData, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="rounded-md border-none p-0 shadow-2xl sm:max-w-[392px]">
        <div className="px-6 py-7">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-[18px] font-semibold text-slate-950">
              {initialData ? editTitle : addTitle}
            </DialogTitle>
            <p className="text-sm text-slate-500">{descriptionText}</p>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Warehouse</Label>
              <Controller
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? String(field.value) : ''}
                    onChange={(value) => field.onChange(Number(value))}
                    options={warehouses.map((warehouse) => ({ value: String(warehouse.id), label: warehouse.name }))}
                    placeholder={isLoadingWarehouses ? 'Memuat warehouse...' : 'Pilih warehouse'}
                    searchPlaceholder="Cari warehouse..."
                    emptyText="Warehouse tidak ditemukan."
                    loading={isLoadingWarehouses}
                    className="h-12 rounded-md border-slate-200 bg-white px-4 text-[15px]"
                  />
                )}
              />
              {form.formState.errors.warehouseId ? <p className="text-xs text-red-600">{form.formState.errors.warehouseId.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Supplier</Label>
              <Input {...form.register('supplierName')} placeholder="Masukkan nama supplier" className="h-12 rounded-md border-slate-200 px-4 text-[15px]" />
              {form.formState.errors.supplierName ? <p className="text-xs text-red-600">{form.formState.errors.supplierName.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">{dateLabel}</Label>
              <Controller
                control={form.control}
                name="transactionDate"
                render={({ field }) => (
                  <DatePicker
                    value={toDateValue(field.value)}
                    onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                    placeholder="Pick a Date"
                    className="h-12 rounded-md border-slate-200 px-4 text-[15px]"
                  />
                )}
              />
              {form.formState.errors.transactionDate ? <p className="text-xs text-red-600">{form.formState.errors.transactionDate.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Keterangan</Label>
              <Textarea {...form.register('description')} placeholder={descriptionPlaceholder} rows={4} className="rounded-md border-slate-200 px-4 py-3 text-[15px]" />
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
