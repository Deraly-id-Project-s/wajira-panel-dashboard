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
import type { Customer } from '@/@types/customer.types';
import type { GoodsIssue } from '@/@types/goods-issue.types';
import { goodsIssueSchema, type GoodsIssueFormValues } from '@/scheme/goods-issue.schema';

interface GoodsIssueFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GoodsIssueFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  initialData?: GoodsIssue | null;
  customers: Customer[];
  isLoadingCustomers?: boolean;
  customerSearch?: string;
  onCustomerSearchChange?: (value: string) => void;
}

const toDateValue = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export function GoodsIssueFormModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  customers,
  isLoadingCustomers = false,
  customerSearch = '',
  onCustomerSearchChange,
}: GoodsIssueFormModalProps) {
  const customerOptions = useMemo(
    () =>
      customers.map((customer) => ({
        value: String(customer.id),
        label: customer.name,
        subtitle: [customer.code, customer.phone].filter(Boolean).join(' • '),
      })),
    [customers],
  );

  const form = useForm<GoodsIssueFormValues>({
    resolver: zodResolver(goodsIssueSchema),
    defaultValues: {
      customerId: 0,
      transactionDate: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      customerId: initialData?.customerId ?? 0,
      transactionDate: initialData?.transactionDate ?? '',
      description: initialData?.description ?? '',
    });
  }, [form, initialData, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="rounded-[20px] border-none p-0 shadow-2xl sm:max-w-[392px]">
        <div className="px-5 py-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-[18px] font-semibold text-slate-950">Input Pengeluaran Material</DialogTitle>
            <p className="text-sm text-slate-500">Masukkan detail pengeluaran material</p>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Kode Pengeluaran</Label>
              <div className="flex h-10 items-center rounded-[10px] border border-slate-200 px-3 text-[15px] text-slate-400">Auto Generate</div>
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Tanggal Pengeluaran</Label>
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
              <Label className="text-[15px] font-medium text-slate-900">Customer</Label>
              <Controller
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? String(field.value) : ''}
                    onChange={(value) => field.onChange(Number(value))}
                    options={customerOptions}
                    placeholder={isLoadingCustomers ? 'Memuat customer...' : 'Masukkan nama customer'}
                    searchPlaceholder="Cari customer..."
                    emptyText="Customer tidak ditemukan."
                    loading={isLoadingCustomers}
                    onSearchChange={onCustomerSearchChange}
                    className="h-10 rounded-[10px] border-slate-200 bg-white px-3 text-[15px]"
                  />
                )}
              />
              {form.formState.errors.customerId ? <p className="text-xs text-red-600">{form.formState.errors.customerId.message}</p> : null}
              {customerSearch ? <p className="text-xs text-slate-500">Pencarian: {customerSearch}</p> : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Keterangan</Label>
              <Textarea {...form.register('description')} rows={4} placeholder="Contoh: Barang sudah diterima" className="rounded-[10px] border-slate-200 px-3 py-2 text-[15px]" />
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
