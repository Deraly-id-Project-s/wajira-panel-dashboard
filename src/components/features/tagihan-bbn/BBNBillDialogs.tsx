import * as React from 'react';
import { Search } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BBNBill, BBNBillPayload } from '@/@types/bbn-bill.types';
import type { SearchableSelectOption } from '@/components/features/vehicle-data/SearchableSelect';
import { calculateOutstanding, formatBillCode, formatCurrency, toDateValue, toPayloadDate } from '@/components/features/tagihan-bbn/utils';

interface BillFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: BBNBillPayload) => Promise<void> | void;
  isSubmitting?: boolean;
  ditlantasOptions: SearchableSelectOption[];
  onDitlantasSearchChange: (value: string) => void;
  initialData?: BBNBill | null;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { paidDate: string; cashId: number; amount: number }) => Promise<void> | void;
  isSubmitting?: boolean;
  bill: BBNBill | null;
  cashOptions: Array<{ id: number; label: string }>;
}

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  isDeleting?: boolean;
  bill: BBNBill | null;
}

type BillFormValues = {
  ditlantasProcessId: string;
  billDate?: Date;
  paidDate?: Date;
};

type PaymentDialogValues = {
  paidDate?: Date;
  cashId: string;
  amount: number;
};

export function BBNBillFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  ditlantasOptions,
  onDitlantasSearchChange,
  initialData,
}: BillFormDialogProps) {
  const form = useForm<BillFormValues>({
    defaultValues: {
      ditlantasProcessId: '',
      billDate: undefined,
      paidDate: undefined,
    },
  });

  React.useEffect(() => {
    if (!open) return;

    form.reset({
      ditlantasProcessId: initialData?.ditlantasProcess?.id
        ? String(initialData.ditlantasProcess.id)
        : initialData?.dealerId
          ? String(initialData.dealerId)
          : '',
      billDate: toDateValue(initialData?.billDate),
      paidDate: toDateValue(initialData?.paidDate),
    });
  }, [form, initialData, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-[420px] rounded-[24px] border border-slate-200 p-6 bg-white shadow-lg">
        <div>
          <DialogHeader className="mb-5">
            <DialogTitle className="text-[18px] font-bold text-slate-900">
              {initialData ? 'Ubah Data Tagihan' : 'Tambah Data Tagihan'}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(async (values) => {
              await onSubmit({
                ditlantasProcessId: values.ditlantasProcessId,
                billDate: toPayloadDate(values.billDate),
                paidDate: toPayloadDate(values.paidDate),
              });
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-950">Kode Ditlantas</Label>
              <Controller
                name="ditlantasProcessId"
                control={form.control}
                rules={{ required: true }}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={ditlantasOptions}
                    onSearchChange={onDitlantasSearchChange}
                    placeholder="Masukkan Kode Ditlantas"
                    searchPlaceholder="Cari proses Ditlantas..."
                    emptyText="Proses Ditlantas tidak ditemukan."
                    className="h-11 rounded-md border-slate-200"
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-950">Tanggal Tagihan</Label>
              <Controller
                name="billDate"
                control={form.control}
                rules={{ required: true }}
                render={({ field }) => (
                  <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick a date" className="h-11 rounded-md border-slate-200 w-full" />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-950">Tanggal Bayar</Label>
              <Controller
                name="paidDate"
                control={form.control}
                render={({ field }) => (
                  <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick a date" className="h-11 rounded-md border-slate-200 w-full" />
                )}
              />
            </div>

            <div className="flex flex-col gap-3 pt-3">
              <Button type="submit" disabled={isSubmitting} className="h-11 rounded-md text-sm btn-primary!">
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 w-full rounded-md border-slate-200 text-sm font-medium text-slate-700 bg-white">
                Batal
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}



export function BBNBillPaymentDialog({ open, onOpenChange, onSubmit, isSubmitting = false, bill, cashOptions }: PaymentDialogProps) {
  const form = useForm<PaymentDialogValues>({
    defaultValues: {
      paidDate: undefined,
      cashId: '',
      amount: 0,
    },
  });

  React.useEffect(() => {
    if (!open || !bill) return;
    const outstanding = calculateOutstanding(bill.bruttoAmount, bill.paidAmount);
    form.reset({
      paidDate: undefined,
      cashId: cashOptions[0] ? String(cashOptions[0].id) : '',
      amount: outstanding,
    });
  }, [open, bill, cashOptions, form]);

  const outstanding = React.useMemo(() => {
    if (!bill) return 0;
    return calculateOutstanding(bill.bruttoAmount, bill.paidAmount);
  }, [bill]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-[420px] rounded-[24px] border border-slate-200 p-6 bg-white shadow-lg">
        <div>
          <DialogHeader className="mb-5">
            <DialogTitle className="text-[18px] font-bold text-slate-900">Tambah Data Tagihan</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(async (values) => {
              await onSubmit({
                paidDate: toPayloadDate(values.paidDate),
                cashId: Number(values.cashId),
                amount: Number(values.amount || 0),
              });
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-950">Nomor Tagihan</Label>
              <Input value={bill ? (bill.code || formatBillCode(bill.id)) : ''} readOnly className="h-11 rounded-md border-slate-200 bg-white text-slate-500" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-950">Tanggal Bayar</Label>
              <Controller
                name="paidDate"
                control={form.control}
                rules={{ required: true }}
                render={({ field }) => (
                  <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick a date" className="h-11 rounded-md border-slate-200" />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-950">Kas Masuk</Label>
              <Controller
                name="cashId"
                control={form.control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 rounded-md border-slate-200">
                      <SelectValue placeholder="Select an item" />
                    </SelectTrigger>
                    <SelectContent>
                      {cashOptions.map((cash) => (
                        <SelectItem key={cash.id} value={String(cash.id)}>
                          {cash.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-950">Total Tagihan</Label>
              <Controller
                name="amount"
                control={form.control}
                rules={{ required: true }}
                render={({ field }) => (
                  <MoneyInput value={field.value} onChangeValue={field.onChange} placeholder="Rp" className="h-11 rounded-md border-slate-200" />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-950">Kurang Bayar</Label>
              <Input value={formatCurrency(outstanding)} readOnly className="h-11 rounded-md border-slate-200 bg-white text-slate-500" />
            </div>

            <div className="flex flex-col gap-3 pt-3">
              <Button type="submit" disabled={isSubmitting} className="h-11 rounded-md text-sm btn-primary!">
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 w-full rounded-md border-slate-200 text-sm font-medium text-slate-700 bg-white">
                Batal
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteBBNBillDialog({ open, onOpenChange, onConfirm, isDeleting = false, bill }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] rounded-md border border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold text-slate-900">Hapus Tagihan BBN</DialogTitle>
        </DialogHeader>
        <p className="text-sm leading-6 text-slate-600">
          Apakah Anda yakin ingin menghapus tagihan <span className="font-semibold text-slate-900">{bill ? formatBillCode(bill.id) : '-'}</span>?
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-md border-slate-200">
            Batal
          </Button>
          <Button type="button" variant="destructive" onClick={() => onConfirm()} disabled={isDeleting} className="rounded-md">
            {isDeleting ? 'Menghapus...' : 'Hapus'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
