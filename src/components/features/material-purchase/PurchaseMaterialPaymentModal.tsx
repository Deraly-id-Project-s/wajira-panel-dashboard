import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import type { Kas } from '@/@types/kas.types';
import type { MaterialTransaction } from '@/@types/material-transaction.types';
import { materialTransactionBillingSchema, type MaterialTransactionBillingFormValues } from '@/scheme/material-transaction.schema';

interface PurchaseMaterialPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: MaterialTransactionBillingFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  transaction: MaterialTransaction;
  cashes: Kas[];
  isLoadingCashes?: boolean;
  title?: string;
  codeLabel?: string;
  counterpartyLabel?: string;
  totalLabel?: string;
  paymentDateLabel?: string;
}

const toDateValue = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const getPaymentLabel = (cash: Kas) => {
  const normalizedCode = cash.code.toUpperCase();
  const normalizedDescription = cash.description.toUpperCase();

  if (normalizedCode.includes('USD') || normalizedDescription.includes('USD')) return 'BCA USD';
  if (normalizedCode.includes('BCA') || normalizedDescription.includes('BCA')) return 'BCA IDR';
  return 'CASH IDR';
};

const getPaymentOptions = (cashes: Kas[]) => {
  const unique = new Map<string, Kas>();

  cashes.forEach((cash) => {
    const label = getPaymentLabel(cash);
    if (!unique.has(label)) {
      unique.set(label, cash);
    }
  });

  const preferredOrder = ['BCA USD', 'BCA IDR', 'CASH IDR'];
  const sorted = Array.from(unique.entries()).sort((a, b) => preferredOrder.indexOf(a[0]) - preferredOrder.indexOf(b[0]));

  return sorted.map(([label, cash]) => ({
    label,
    value: Number(cash.id),
  }));
};

export function PurchaseMaterialPaymentModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  transaction,
  cashes,
  isLoadingCashes = false,
  title = 'Pembayaran Pembelian',
  codeLabel = 'Nomor Pembelian',
  counterpartyLabel = 'Supplier',
  totalLabel = 'Total Tagihan',
  paymentDateLabel = 'Tanggal Bayar',
}: PurchaseMaterialPaymentModalProps) {
  const paymentOptions = useMemo(() => getPaymentOptions(cashes), [cashes]);

  const form = useForm<MaterialTransactionBillingFormValues>({
    resolver: zodResolver(materialTransactionBillingSchema),
    defaultValues: {
      cashId: 0,
      amount: transaction.totalUnpaid,
      paymentDate: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      cashId: paymentOptions[0]?.value ?? 0,
      amount: transaction.totalUnpaid,
      paymentDate: '',
      description: '',
    });
  }, [open, transaction.id, transaction.totalUnpaid, form, paymentOptions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-hidden rounded-md border border-slate-200 px-0 py-0 sm:max-w-[410px]">
        <div className="overflow-y-auto px-6 py-7">
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-[20px] font-semibold text-slate-900">{title}</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-5">
            <div className="space-y-2.5">
              <Label className="text-[16px] font-medium text-slate-900">{codeLabel}</Label>
              <Input value={transaction.code} readOnly className="h-12 rounded-md border-slate-200 px-4 text-[16px] text-slate-500 shadow-sm" />
            </div>

            <div className="space-y-2.5">
              <Label className="text-[16px] font-medium text-slate-900">{counterpartyLabel}</Label>
              <Input value={transaction.supplierName} readOnly className="h-12 rounded-md border-slate-200 px-4 text-[16px] text-slate-500 shadow-sm" />
            </div>

            <div className="space-y-2.5">
              <Label className="text-[16px] font-medium text-slate-900">{paymentDateLabel}</Label>
              <Controller
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <DatePicker
                    value={toDateValue(field.value)}
                    onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                    placeholder="Pick a date"
                    className="h-12 rounded-md border-slate-200 px-4 text-[16px] shadow-sm"
                  />
                )}
              />
              {form.formState.errors.paymentDate ? <p className="text-sm text-red-600">{form.formState.errors.paymentDate.message}</p> : null}
            </div>

            <div className="space-y-2.5">
              <Label className="text-[16px] font-medium text-slate-900">{totalLabel}</Label>
              <Input value={`Rp${transaction.totalUnpaid.toLocaleString('id-ID')}`} readOnly className="h-12 rounded-md border-slate-200 px-4 text-[16px] text-slate-500 shadow-sm" />
            </div>

            <div className="space-y-2.5">
              <Label className="text-[16px] font-medium text-slate-900">Nominal Bayar</Label>
              <Controller
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <MoneyInput
                    value={field.value}
                    onChangeValue={field.onChange}
                    placeholder="Masukkan nominal bayar"
                    className="h-12 rounded-md border-slate-200 px-4 text-[16px] shadow-sm"
                  />
                )}
              />
              {form.formState.errors.amount ? <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p> : null}
            </div>

            <div className="space-y-2.5">
              <Label className="text-[16px] font-medium text-slate-900">Pembayaran</Label>
              <Controller
                control={form.control}
                name="cashId"
                render={({ field }) => (
                  <Select value={field.value ? String(field.value) : ''} onValueChange={(value) => field.onChange(Number(value))}>
                    <SelectTrigger className="h-12 rounded-md border-slate-200 px-4 text-[16px] shadow-sm">
                      <SelectValue placeholder={isLoadingCashes ? 'Memuat kas...' : 'Select an item'} />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentOptions.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.cashId ? <p className="text-sm text-red-600">{form.formState.errors.cashId.message}</p> : null}
            </div>

            <div className="space-y-2.5">
              <Label className="text-[16px] font-medium text-slate-900">Keterangan</Label>
              <Textarea {...form.register('description')} rows={4} placeholder="Type your message here." className="rounded-md border-slate-200 px-4 py-3 text-[16px] shadow-sm" />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="h-11 rounded-md text-[16px] btn-primary!">
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
