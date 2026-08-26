'use client';

import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import { z } from 'zod';

export const goodsTransactionFormSchema = z.object({
  partnerId: z.coerce.number().min(1, 'Pihak terkait wajib dipilih'),
  transactionDate: z.string().min(1, 'Tanggal transaksi wajib diisi'),
  description: z.string().optional(),
});

export type GoodsTransactionFormValues = z.infer<typeof goodsTransactionFormSchema>;

export interface GoodsTransactionFormModalProps {
  type: 'receipt' | 'issue';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => Promise<void> | void;
  isSubmitting?: boolean;
  initialData?: any;
  partners: Array<{ id: number | string; name: string; code?: string | null; phone?: string | null }>;
  isLoadingPartners?: boolean;
  partnerSearch?: string;
  onPartnerSearchChange?: (value: string) => void;
}

const toDateValue = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export function GoodsTransactionFormModal({
  type,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  partners,
  isLoadingPartners = false,
  partnerSearch = '',
  onPartnerSearchChange,
}: GoodsTransactionFormModalProps) {
  const isReceipt = type === 'receipt';
  const partnerLabel = isReceipt ? 'Supplier' : 'Customer';
  const transactionDateLabel = isReceipt ? 'Tanggal Pembelian' : 'Tanggal Penjualan';
  const codeLabel = isReceipt ? 'Kode Pembelian' : 'Kode Penjualan';

  const partnerOptions = useMemo(
    () =>
      partners.map((p) => ({
        value: String(p.id),
        label: p.name,
        subtitle: [p.code, p.phone].filter(Boolean).join(' • '),
      })),
    [partners],
  );

  const form = useForm<GoodsTransactionFormValues>({
    resolver: zodResolver(goodsTransactionFormSchema),
    defaultValues: {
      partnerId: 0,
      transactionDate: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    const partnerIdVal = initialData?.supplierId ?? initialData?.customerId ?? initialData?.partnerId ?? 0;
    form.reset({
      partnerId: Number(partnerIdVal) || 0,
      transactionDate: initialData?.transactionDate ?? '',
      description: initialData?.description ?? '',
    });
  }, [form, initialData, open]);

  const handleFormSubmit = async (values: GoodsTransactionFormValues) => {
    if (isReceipt) {
      await onSubmit({
        supplierId: values.partnerId,
        transactionDate: values.transactionDate,
        description: values.description,
      });
    } else {
      await onSubmit({
        customerId: values.partnerId,
        transactionDate: values.transactionDate,
        description: values.description,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="flex max-h-[90dvh] flex-col rounded-md border-none p-0 shadow-2xl sm:max-w-[392px]">
        <div className="shrink-0 px-5 pt-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-[18px] font-semibold text-slate-950">
              Input {isReceipt ? 'Penerimaan' : 'Pengeluaran'} Material
            </DialogTitle>
            <p className="text-sm text-slate-500">
              Masukkan detail {isReceipt ? 'penerimaan' : 'pengeluaran'} material
            </p>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto px-5 pb-6">
          <form id="goods-transaction-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">{codeLabel}</Label>
              <div className="flex h-10 items-center rounded-[10px] border border-slate-200 px-3 text-[15px] text-slate-400">
                Auto Generate
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">{transactionDateLabel}</Label>
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
              <Label className="text-[15px] font-medium text-slate-900">Nama {partnerLabel}</Label>
              <Controller
                control={form.control}
                name="partnerId"
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? String(field.value) : ''}
                    onChange={(value) => field.onChange(Number(value))}
                    options={partnerOptions}
                    placeholder={isLoadingPartners ? `Memuat ${partnerLabel.toLowerCase()}...` : `Masukkan nama ${partnerLabel.toLowerCase()}`}
                    searchPlaceholder={`Cari ${partnerLabel.toLowerCase()}...`}
                    emptyText={`${partnerLabel} tidak ditemukan.`}
                    loading={isLoadingPartners}
                    onSearchChange={onPartnerSearchChange}
                    className="h-10 rounded-[10px] border-slate-200 bg-white px-3 text-[15px]"
                  />
                )}
              />
              {form.formState.errors.partnerId ? (
                <p className="text-xs text-red-600">{form.formState.errors.partnerId.message}</p>
              ) : null}
              {partnerSearch ? <p className="text-xs text-slate-500">Pencarian: {partnerSearch}</p> : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Keterangan</Label>
              <Textarea
                {...form.register('description')}
                rows={4}
                placeholder={isReceipt ? 'Contoh: Barang sudah diterima' : 'Contoh: Barang sudah dikirimkan'}
                className="rounded-[10px] border-slate-200 px-3 py-2 text-[15px]"
              />
            </div>
          </form>
        </div>

        <div className="shrink-0 space-y-3 border-t border-slate-100 px-5 pb-6 pt-4">
          <Button
            type="submit"
            form="goods-transaction-form"
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
