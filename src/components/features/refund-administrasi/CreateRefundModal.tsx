import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PackageSearch } from 'lucide-react';
import { createRefundSchema, type CreateRefundFormValues } from '@/schemas/refund.schema';
import { useCreateRefund, useRefundSelectableItems } from '@/hooks/useRefundAdministrasi';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils/currency';
import { toast } from 'sonner';
import { LoadingState } from '@/components/ui/loading-state';

const parseCurrencyInput = (value: string) => {
  const numericValue = value.replace(/[^\d]/g, '');
  return numericValue ? Number(numericValue) : 0;
};

interface CreateRefundModalProps {
  open: boolean;
  onClose: () => void;
  transactionId: string;
}

export default function CreateRefundModal({ open, onClose, transactionId }: CreateRefundModalProps) {
  const { transactionQuery, itemDetailsQuery, items } = useRefundSelectableItems(transactionId);
  const createRefundMutation = useCreateRefund();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateRefundFormValues>({
    resolver: zodResolver(createRefundSchema),
    defaultValues: {
      unit_transaction_id: transactionId,
      refund_date: new Date().toISOString().split('T')[0],
      refund_amount: undefined,
      note: '',
      unit_transaction_item_detail_ids: [],
    },
  });

  const selectedIds = watch('unit_transaction_item_detail_ids');
  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(Number(item.id))),
    [items, selectedIds],
  );
  const selectedTotal = useMemo(
    () => selectedItems.reduce((total, item) => total + Number(item.price ?? 0), 0),
    [selectedItems],
  );

  useEffect(() => {
    if (!open) return;

    reset({
      unit_transaction_id: transactionId,
      refund_date: new Date().toISOString().split('T')[0],
      refund_amount: undefined,
      note: '',
      unit_transaction_item_detail_ids: [],
    });
  }, [open, reset, transactionId]);

  const transaction = transactionQuery.data;
  const personName = transaction?.person?.name ?? '-';
  const transactionCode = transaction?.code ?? '-';

  const toggleItem = (itemId: number, checked: boolean) => {
    const next = checked ? [...selectedIds, itemId] : selectedIds.filter((id) => id !== itemId);
    setValue('unit_transaction_item_detail_ids', next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const toggleAllItems = (checked: boolean) => {
    setValue(
      'unit_transaction_item_detail_ids',
      checked ? items.map((item) => Number(item.id)) : [],
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  const onSubmit = async (values: CreateRefundFormValues) => {
    try {
      await createRefundMutation.mutateAsync(values);
      toast.success('Refund berhasil dibuat');
      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal membuat refund');
    }
  };

  const isLoading = transactionQuery.isLoading || itemDetailsQuery.isLoading;
  const allSelected = items.length > 0 && selectedIds.length === items.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <DialogTitle>Buat Refund Baru</DialogTitle>
          <DialogDescription>
            Pilih unit yang akan direfund dari transaksi <span className="font-medium text-slate-900">{transactionCode}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-6 py-6">
          <div className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Kode Transaksi</p>
              <p className="text-sm font-semibold text-slate-900">{transactionCode}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Relasi</p>
              <p className="text-sm font-semibold text-slate-900">{personName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Nilai Unit Terpilih</p>
              <p className="text-sm font-semibold text-emerald-700">{formatCurrency(selectedTotal)}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="refund_date">Tanggal Refund</Label>
              <Controller control={control} name="refund_date" render={({ field }) => <InputDate id="refund_date" {...field} />} />
              {errors.refund_date ? <p className="text-sm text-red-600">{errors.refund_date.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="refund_amount">Nominal Refund</Label>
              <Controller
                control={control}
                name="refund_amount"
                render={({ field }) => (
                  <Input
                    id="refund_amount"
                    type="text"
                    inputMode="numeric"
                    value={field.value === undefined || field.value === null || Number(field.value) === 0 ? '' : formatCurrency(Number(field.value))}
                    onChange={(event) => {
                      field.onChange(parseCurrencyInput(event.target.value));
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                )}
              />
              {!errors.refund_amount ? <p className="text-xs text-slate-500">Nominal refund diisi manual. Nilai unit terpilih hanya sebagai referensi.</p> : null}
              {errors.refund_amount ? <p className="text-sm text-red-600">{errors.refund_amount.message}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Catatan Refund</Label>
            <Input id="note" placeholder="Contoh: refund karena terdapat kecacatan" {...register('note')} />
            {errors.note ? <p className="text-sm text-red-600">{errors.note.message}</p> : null}
          </div>

          <div className="overflow-hidden rounded-md border border-slate-200">
            <div className="border-b border-slate-200 bg-white px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Pilih Unit Transaksi</h3>
              <p className="text-xs text-slate-500">Hanya unit milik transaksi ini yang bisa dipilih.</p>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-14 text-center">
                    <Checkbox checked={allSelected} onCheckedChange={(checked) => toggleAllItems(Boolean(checked))} />
                  </TableHead>
                  <TableHead>Warna</TableHead>
                  <TableHead>No. Mesin</TableHead>
                  <TableHead>No. Rangka</TableHead>
                  <TableHead>Status Stok</TableHead>
                  <TableHead>Status Forecast</TableHead>
                  <TableHead>Status Unit</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                  <TableHead className="text-right">Nilai Refund</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-36">
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                        <LoadingState variant="inline" text={null} />
                        Memuat item transaksi...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-36">
                      <div className="flex flex-col items-center justify-center gap-2 text-center text-sm text-slate-500">
                        <PackageSearch className="h-5 w-5" />
                        Tidak ada unit transaksi yang tersedia untuk direfund.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50">
                      <TableCell>
                        <Controller
                          control={control}
                          name="unit_transaction_item_detail_ids"
                          render={() => (
                            <Checkbox
                              checked={selectedIds.includes(Number(item.id))}
                              onCheckedChange={(checked) => toggleItem(Number(item.id), Boolean(checked))}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>{item?.color || '-'}</TableCell>
                      <TableCell>{item?.machine_number || '-'}</TableCell>
                      <TableCell>{item?.chassis_number || '-'}</TableCell>
                      <TableCell>{item?.in_stock ? 'Tersedia' : 'Tidak tersedia'}</TableCell>
                      <TableCell>{item?.is_forecast ? 'Forecast' : 'Normal'}</TableCell>
                      <TableCell>{item?.status || '-'}</TableCell>
                      <TableCell>{item?.created_at ? new Date(item?.created_at).toLocaleDateString('id-ID') : '-'}</TableCell>
                      <TableCell className="text-right font-medium text-slate-900">{formatCurrency(Number(item.price ?? 0))}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {errors.unit_transaction_item_detail_ids ? (
            <p className="text-sm text-red-600">{errors.unit_transaction_item_detail_ids.message}</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={createRefundMutation.isPending}>
              Batal
            </Button>
            <Button type="submit" className="min-w-36" disabled={createRefundMutation.isPending || isLoading}>
              {createRefundMutation.isPending ? <LoadingState variant="inline" text={null} /> : null}
              Simpan Refund
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
