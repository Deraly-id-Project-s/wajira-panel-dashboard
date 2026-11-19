import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputDate } from '@/components/ui/input-date';
import { MoneyInput } from '@/components/ui/money-input';
import { FileInput } from '@/components/ui/file-input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';
import { parseAndClampMoneyInput } from '@/lib/utils/money-input';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { getObjectStorageUrl } from '@/components/ui/storage-image';

const paymentSchema = z.object({
  payment_at: z.string().min(1, 'Tanggal bayar wajib diisi'),
  cash_payment_amount: z.coerce.number().min(0).default(0),
  bca_payment_amount: z.coerce.number().min(0).default(0),
  bca_payment_usd_amount: z.coerce.number().min(0).default(0),
  note: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentSchema> & {
  payment_proof?: File | null;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentFormData) => void;
  defaultValues?: Partial<PaymentFormData & { payment_proof?: string | File | null }>;
  loading?: boolean;
  remainingPayment: number;
  isUsdTransaction?: boolean;
}

export function PaymentModal({
  open,
  onClose,
  onSubmit,
  defaultValues,
  loading,
  remainingPayment,
  isUsdTransaction = false,
}: Props) {
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [existingProof, setExistingProof] = useState<string | null>(null);

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema) as any,
    defaultValues: {
      payment_at: new Date().toISOString().split('T')[0],
      cash_payment_amount: 0,
      bca_payment_amount: 0,
      bca_payment_usd_amount: 0,
      note: '',
    },
  });

  useEffect(() => {
    if (open) {
      setPaymentProof(null);
      if (defaultValues) {
        setExistingProof(typeof defaultValues.payment_proof === 'string' ? defaultValues.payment_proof : null);
        form.reset({
          payment_at: defaultValues.payment_at || new Date().toISOString().split('T')[0],
          cash_payment_amount: defaultValues.cash_payment_amount || 0,
          bca_payment_amount: defaultValues.bca_payment_amount || 0,
          bca_payment_usd_amount: defaultValues.bca_payment_usd_amount || 0,
          note: defaultValues.note || '',
        });
      } else {
        setExistingProof(null);
        form.reset({
          payment_at: new Date().toISOString().split('T')[0],
          cash_payment_amount: 0,
          bca_payment_amount: 0,
          bca_payment_usd_amount: 0,
          note: '',
        });
      }
    }
  }, [open, defaultValues, form]);

  const paymentCash = Number(form.watch('cash_payment_amount') || 0);
  const paymentBca = Number(form.watch('bca_payment_amount') || 0);
  const paymentUsd = Number(form.watch('bca_payment_usd_amount') || 0);

  const currentRecordAmount = defaultValues
    ? isUsdTransaction
      ? Number(defaultValues.bca_payment_usd_amount || 0)
      : Number(defaultValues.cash_payment_amount || 0) + Number(defaultValues.bca_payment_amount || 0)
    : 0;

  const allowedRemaining = remainingPayment + currentRecordAmount;

  const maxCash = Math.max(0, allowedRemaining - paymentBca);
  const maxBca = Math.max(0, allowedRemaining - paymentCash);
  const maxUsd = Math.max(0, allowedRemaining);

  const handleSubmit = (data: z.infer<typeof paymentSchema>) => {
    if (isUsdTransaction) {
      if (Number(data.bca_payment_usd_amount) <= 0) {
        form.setError('bca_payment_usd_amount', { message: 'Nominal pembayaran USD wajib diisi' });
        return;
      }
    } else {
      if (Number(data.cash_payment_amount) <= 0 && Number(data.bca_payment_amount) <= 0) {
        form.setError('cash_payment_amount', { message: 'Minimal salah satu nominal pembayaran harus diisi' });
        return;
      }
    }

    onSubmit({
      ...data,
      payment_proof: paymentProof,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? 'Edit Riwayat Pembayaran' : 'Tambah Riwayat Pembayaran'}
          </DialogTitle>
        </DialogHeader>

        <div className="bg-rose-50 border border-rose-100 rounded-md p-3 text-sm flex justify-between items-center text-rose-800 font-semibold my-2">
          <span>Kurang Bayar (Sisa Tagihan):</span>
          <span>
            {currenciesFormat(isUsdTransaction ? 'usd' : 'idr', remainingPayment)}
          </span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="payment_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Transaksi Pembayaran</FormLabel>
                  <FormControl>
                    <InputDate {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isUsdTransaction ? (
              <FormField
                control={form.control}
                name="bca_payment_usd_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pembayaran BCA USD ($)</FormLabel>
                    <FormControl>
                      <MoneyInput
                        name={field.name}
                        value={field.value}
                        onChangeValue={(val) => {
                          const capped = parseAndClampMoneyInput(val, maxUsd);
                          field.onChange(capped);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cash_payment_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pembayaran Cash/Tunai</FormLabel>
                      <FormControl>
                        <MoneyInput
                          name={field.name}
                          value={field.value}
                          onChangeValue={(val) => {
                            const capped = parseAndClampMoneyInput(val, maxCash);
                            field.onChange(capped);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bca_payment_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pembayaran Transfer (BCA)</FormLabel>
                      <FormControl>
                        <MoneyInput
                          name={field.name}
                          value={field.value}
                          onChangeValue={(val) => {
                            const capped = parseAndClampMoneyInput(val, maxBca);
                            field.onChange(capped);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormItem>
              <FormLabel>Bukti Pembayaran (Opsional)</FormLabel>
              <FormControl>
                <FileInput
                  value={paymentProof}
                  onFileChange={setPaymentProof}
                  helperText="Format PNG, JPG, atau PDF maksimal 2MB"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                />
              </FormControl>
              {existingProof && !paymentProof && (
                <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                  <span>Bukti tersimpan:</span>
                  <a
                    href={getObjectStorageUrl(existingProof)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline font-medium"
                  >
                    Lihat Bukti
                  </a>
                </div>
              )}
            </FormItem>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan Tambahan</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tulis asalmula uang atau referensi (opsional)"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                Batal
              </Button>
              <Button type="submit" className="bg-[#1e293b] text-white" disabled={loading}>
                <Save className="w-4 h-4 mr-2" /> Simpan
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
