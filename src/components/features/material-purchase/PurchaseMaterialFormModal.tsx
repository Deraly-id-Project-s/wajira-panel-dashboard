import { useEffect } from 'react';
import { Search } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import type { MaterialTransaction } from '@/types/material-transaction.types';
import type { WarehouseOption } from '@/types/pengeluaran-unit.types';
import { materialTransactionSchema, type MaterialTransactionFormValues } from '@/schemas/material-transaction.schema';

interface PurchaseMaterialFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: MaterialTransactionFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  initialData?: MaterialTransaction | null;
  warehouses: WarehouseOption[];
  isLoadingWarehouses?: boolean;
  addTitle?: string;
  editTitle?: string;
  codeLabel?: string;
  warehouseLabel?: string;
  counterpartyLabel?: string;
  counterpartyPlaceholder?: string;
  dateLabel?: string;
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
  totalPaidLabel?: string;
}

const toDateValue = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export function PurchaseMaterialFormModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  warehouses,
  isLoadingWarehouses = false,
  addTitle = 'Tambah Data Beli',
  editTitle = 'Edit Data Beli',
  codeLabel = 'Kode Pembelian',
  warehouseLabel = 'Warehouse',
  counterpartyLabel = 'Nama Supplier',
  counterpartyPlaceholder = 'Masukkan supplier',
  dateLabel = 'Tanggal Pembelian',
  descriptionLabel = 'Keterangan',
  descriptionPlaceholder = 'Masukkan keterangan pembelian',
  totalPaidLabel = 'Total Bayar',
}: PurchaseMaterialFormModalProps) {
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
      <DialogContent className="max-h-[90vh] overflow-hidden rounded-[28px] border border-slate-200 px-0 py-0 sm:max-w-2xl">
        <div className="overflow-y-auto px-6 py-6 sm:px-8 sm:py-7">
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-[24px] font-semibold text-slate-900">
              {initialData ? editTitle : addTitle}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7 pt-4">
            {initialData ? (
              <div className="space-y-3">
                <Label className="text-[18px] font-medium text-slate-900">{codeLabel}</Label>
                <Input
                  value={initialData.code}
                  readOnly
                  className="h-14 rounded-md border-slate-200 px-5 text-[18px] text-slate-500 shadow-sm"
                />
              </div>
            ) : null}

            <div className="space-y-3">
              <Label className="text-[18px] font-medium text-slate-900">{warehouseLabel}</Label>
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
                    className="h-14 rounded-md border-slate-200 px-5 text-[18px] shadow-sm"
                  />
                )}
              />
              {form.formState.errors.warehouseId ? <p className="text-sm text-red-600">{form.formState.errors.warehouseId.message}</p> : null}
            </div>

            <div className="space-y-3">
              <Label className="text-[18px] font-medium text-slate-900">{counterpartyLabel}</Label>
              <Input
                {...form.register('supplierName')}
                placeholder={counterpartyPlaceholder}
                className="h-14 rounded-md border-slate-200 px-5 text-[18px] shadow-sm"
              />
              {form.formState.errors.supplierName ? <p className="text-sm text-red-600">{form.formState.errors.supplierName.message}</p> : null}
            </div>

            <div className="space-y-3">
              <Label className="text-[18px] font-medium text-slate-900">{dateLabel}</Label>
              <Controller
                control={form.control}
                name="transactionDate"
                render={({ field }) => (
                  <DatePicker
                    value={toDateValue(field.value)}
                    onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                    placeholder="Pick a date"
                    className="h-14 rounded-md border-slate-200 px-5 text-[18px] shadow-sm"
                  />
                )}
              />
              {form.formState.errors.transactionDate ? <p className="text-sm text-red-600">{form.formState.errors.transactionDate.message}</p> : null}
            </div>

            <div className="space-y-3">
              <Label className="text-[18px] font-medium text-slate-900">{descriptionLabel}</Label>
              <Textarea
                {...form.register('description')}
                placeholder={descriptionPlaceholder}
                rows={4}
                className="rounded-md border-slate-200 px-5 py-4 text-[16px] shadow-sm"
              />
            </div>

            {initialData ? (
              <div className="space-y-3">
                <Label className="text-[18px] font-medium text-slate-900">{totalPaidLabel}</Label>
                <Input
                  value={`Rp${(initialData.totalPaid || 0).toLocaleString('id-ID')}`}
                  readOnly
                  className="h-14 rounded-md border-slate-200 px-5 text-[18px] text-slate-500 shadow-sm"
                />
              </div>
            ) : null}

            <div className="flex flex-col gap-4 pt-2">
              <Button type="submit" disabled={isSubmitting} className="h-14 rounded-md bg-[#1f4163] text-[18px] font-medium hover:bg-[#183552]">
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-14 rounded-md border-slate-300 text-[18px] font-medium">
                Batal
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
