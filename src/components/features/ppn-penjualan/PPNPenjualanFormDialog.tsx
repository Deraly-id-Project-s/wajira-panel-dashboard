'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { ApiError } from '@/@types/api';
import { type PPNPenjualan, UpdatePPNPenjualanSchema, type UpdatePPNPenjualanFormValues } from '@/@types/ppn.types';
import { useUpdatePPNPenjualan } from '@/hooks/usePPN';
import { FormDialog } from '@/components/ui/form-dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { format } from 'date-fns';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: PPNPenjualan | null;
}

const toDate = (value: string | null | undefined) => {
  if (!value) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeFieldErrors = (error: unknown): Partial<Record<keyof UpdatePPNPenjualanFormValues, string>> => {
  if (!error || typeof error !== 'object' || !('details' in error)) return {};

  const details = (error as ApiError).details;
  if (!details || typeof details !== 'object') return {};

  const entries = Object.entries(details).filter(([, value]) => Array.isArray(value) && value.length > 0);

  return entries.reduce<Partial<Record<keyof UpdatePPNPenjualanFormValues, string>>>((accumulator, [field, messages]) => {
    if (field in UpdatePPNPenjualanSchema.shape) {
      accumulator[field as keyof UpdatePPNPenjualanFormValues] = String((messages as unknown[])[0]);
    }

    return accumulator;
  }, {});
};

export default function PPNPenjualanFormDialog({ open, onClose, initialData }: Props) {
  const updateMutation = useUpdatePPNPenjualan();

  const form = useForm<UpdatePPNPenjualanFormValues>({
    resolver: zodResolver(UpdatePPNPenjualanSchema),
    defaultValues: {
      fp_date: null,
      nsfp_age: null,
      amount: null,
      nsfp_number: '',
    },
  });

  useEffect(() => {
    if (!initialData) {
      form.reset({
        fp_date: null,
        nsfp_age: null,
        amount: null,
        nsfp_number: '',
      });
      return;
    }

    form.reset({
      fp_date: toDate(initialData.fp_date),
      nsfp_age: toDate(initialData.nsfp_age),
      amount: initialData.payment_amount ? Math.round(Number(initialData.payment_amount)) : null,
      nsfp_number: initialData.nsfp_number || '',
    });
  }, [form, initialData]);

  const onSubmit = async (values: UpdatePPNPenjualanFormValues) => {
    if (!initialData) return;

    try {
      await updateMutation.mutateAsync({
        id: initialData.id,
        payload: {
          fp_date: values.fp_date ? format(values.fp_date, 'yyyy-MM-dd') : undefined,
          nsfp_age: values.nsfp_age ? format(values.nsfp_age, 'yyyy-MM-dd') : undefined,
          amount: values.amount ?? undefined,
          nsfp_number: values.nsfp_number || undefined,
        },
      });

      toast.success('Data PPN penjualan berhasil diperbarui');
      onClose();
    } catch (error) {
      const fieldErrors = normalizeFieldErrors(error);

      Object.entries(fieldErrors).forEach(([field, message]) => {
        form.setError(field as keyof UpdatePPNPenjualanFormValues, { message });
      });

      const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Gagal memperbarui data PPN penjualan';
      toast.error(message);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={(nextOpen: boolean) => (!nextOpen ? onClose() : undefined)}
      title="Edit PPN Penjualan"
      description="Edit detail PPN Penjualan"
      onSubmit={(e: React.FormEvent) => { e.preventDefault(); void form.handleSubmit(onSubmit)(); }}
      onCancel={onClose}
      maxWidthClassName="max-w-md"
      isSubmitting={updateMutation.isPending}
    >
      {initialData ? (
        <Form {...form}>
          <div className="space-y-4">
            <div className="grid gap-2">
              <FormLabel>Kode Invoice</FormLabel>
              <Input value={initialData.code} readOnly placeholder="Generated XX" />
            </div>

            <div className="grid gap-2">
              <FormLabel>No Mesin</FormLabel>
              <Input value={initialData.unit_transaction_item_detail?.machine_number || ''} readOnly placeholder="Tambahkan no mesin" />
            </div>

            <FormField
              control={form.control}
              name="fp_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal FPM</FormLabel>
                  <DatePicker value={field.value} onChange={field.onChange} placeholder="Jan 20, 2025" />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nsfp_age"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Masa FPM</FormLabel>
                  <DatePicker value={field.value} onChange={field.onChange} placeholder="Jan 20, 2025" />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nsfp_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor NSFP</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} placeholder="Masukkan nomor NSFP" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biaya</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">Rp.</span>
                      <MoneyInput
                        className="pl-9"
                        value={field.value ?? 0}
                        onChangeValue={(value) => field.onChange(value)}
                        placeholder="Tambahkan biaya"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>
      ) : null}
    </FormDialog>
  );
}
