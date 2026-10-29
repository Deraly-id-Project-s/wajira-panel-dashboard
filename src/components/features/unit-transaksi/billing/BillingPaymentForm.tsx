import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wallet, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputDate } from '@/components/ui/input-date';
import { MoneyInput } from '@/components/ui/money-input';
import { FileInput } from '@/components/ui/file-input';
import { Textarea } from '@/components/ui/textarea';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { parseAndClampMoneyInput } from '@/lib/utils/money-input';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import type { PaymentFormData } from '@/hooks/useUnitTransactionBillingPayment';

const paymentSchema = z.object({
  bcaPayment: z.number().min(0, 'Tidak boleh negatif'),
  cashPayment: z.number().min(0, 'Tidak boleh negatif'),
  bcaPayment2: z.number().min(0, 'Tidak boleh negatif'),
  paymentDate: z.string().min(1, 'Tanggal pembayaran wajib diisi'),
  note: z.string().max(255, 'Maksimal 255 karakter').optional(),
  paymentProof: z.any().optional().nullable(),
});

type PaymentFormSchema = z.infer<typeof paymentSchema>;

export interface BillingPaymentFormProps {
  isUsd: boolean;
  isPaid: boolean;
  remainingPaymentUsd: number;
  remainingPaymentIdr: number;
  loading?: boolean;
  canSubmit?: boolean;
  onSubmit: (data: PaymentFormData) => Promise<void>;
  onCancel?: () => void;
  validationMessage?: string;
}

export function BillingPaymentForm({
  isUsd,
  isPaid,
  remainingPaymentUsd,
  remainingPaymentIdr,
  loading = false,
  canSubmit = true,
  onSubmit,
  onCancel,
  validationMessage,
}: BillingPaymentFormProps) {
  const [proofFile, setProofFile] = useState<File | null>(null);

  const form = useForm<PaymentFormSchema>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      bcaPayment: 0,
      cashPayment: 0,
      bcaPayment2: 0,
      paymentDate: new Date().toISOString().slice(0, 10),
      note: '',
      paymentProof: null,
    },
  });

  const paymentBca = Number(form.watch('bcaPayment') ?? 0);
  const paymentCash = Number(form.watch('cashPayment') ?? 0);
  const paymentBca2 = Number(form.watch('bcaPayment2') ?? 0);

  const maxBca2 = Math.max(0, remainingPaymentIdr - paymentCash);
  const maxCash = Math.max(0, remainingPaymentIdr - paymentBca2);

  const handleSubmit = async (values: PaymentFormSchema) => {
    await onSubmit({
      bcaPayment: values.bcaPayment,
      cashPayment: values.cashPayment,
      bcaPayment2: values.bcaPayment2,
      paymentDate: values.paymentDate,
      note: values.note || undefined,
      paymentProof: proofFile,
    });

    form.reset({
      bcaPayment: 0,
      cashPayment: 0,
      bcaPayment2: 0,
      paymentDate: new Date().toISOString().slice(0, 10),
      note: '',
      paymentProof: null,
    });
    setProofFile(null);
  };

  if (isPaid) {
    return (
      <CollapsibleBox
        title="Status Pembayaran"
        description="Informasi pelunasan tagihan transaksi"
        defaultExpanded={true}
      >
        <div className="flex flex-col items-center justify-center gap-3 py-6 text-center rounded-md border border-emerald-200 bg-emerald-50/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-semibold text-emerald-900">Tagihan Telah Lunas</h4>
            <p className="text-xs text-emerald-700 max-w-md">
              Seluruh kewajiban pembayaran untuk transaksi ini telah diselesaikan. Riwayat arus kas dan transaksi telah terkunci.
            </p>
          </div>
        </div>
      </CollapsibleBox>
    );
  }

  return (
    <CollapsibleBox
      title="Form Pembayaran"
      description="Masukkan rincian pembayaran untuk melunasi sisa tagihan"
      defaultExpanded={true}
    >
      <div className="space-y-6">
        {validationMessage && (
          <div className="flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <span>{validationMessage}</span>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Tanggal Bayar */}
              <div className="space-y-2 md:col-span-3">
                <FormLabel className="text-sm font-medium">Tanggal Bayar</FormLabel>
                <InputDate
                  value={form.watch('paymentDate')}
                  disabled={loading}
                  onChange={(e) => form.setValue('paymentDate', e.target.value)}
                />
              </div>

              {/* Mode USD */}
              {isUsd && (
                <FormField
                  control={form.control}
                  name="bcaPayment"
                  render={({ field }) => (
                    <FormItem className="space-y-2 md:col-span-3">
                      <FormLabel className="text-sm font-medium flex items-center justify-between">
                        <span>BCA USD</span>
                        <span className="text-xs text-slate-500 font-normal">
                          Maks: {currenciesFormat('usd', remainingPaymentUsd)}
                        </span>
                      </FormLabel>
                      <FormControl>
                        <MoneyInput
                          name={field.name}
                          currency="USD"
                          value={Number(field.value) || 0}
                          disabled={loading || remainingPaymentUsd <= 0}
                          onChangeValue={(val) => {
                            const capped = parseAndClampMoneyInput(val, remainingPaymentUsd, 'USD');
                            field.onChange(capped);
                          }}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Mode IDR */}
              {!isUsd && (
                <>
                  <FormField
                    control={form.control}
                    name="bcaPayment2"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium flex items-center justify-between">
                          <span>BCA IDR</span>
                          <span className="text-xs text-slate-500 font-normal">
                            Maks: {currenciesFormat('idr', maxBca2)}
                          </span>
                        </FormLabel>
                        <FormControl>
                          <MoneyInput
                            name={field.name}
                            value={Number(field.value) || 0}
                            disabled={loading || remainingPaymentIdr <= 0}
                            onChangeValue={(val) => {
                              const capped = parseAndClampMoneyInput(val, maxBca2);
                              field.onChange(capped);
                            }}
                            onBlur={field.onBlur}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cashPayment"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium flex items-center justify-between">
                          <span>Cash IDR</span>
                          <span className="text-xs text-slate-500 font-normal">
                            Maks: {currenciesFormat('idr', maxCash)}
                          </span>
                        </FormLabel>
                        <FormControl>
                          <MoneyInput
                            name={field.name}
                            value={Number(field.value) || 0}
                            disabled={loading || remainingPaymentIdr <= 0}
                            onChangeValue={(val) => {
                              const capped = parseAndClampMoneyInput(val, maxCash);
                              field.onChange(capped);
                            }}
                            onBlur={field.onBlur}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            {/* Bukti Pembayaran */}
            <div className="space-y-2 border-t pt-4">
              <FormLabel className="text-sm font-medium">Bukti Pembayaran (Opsional)</FormLabel>
              <FileInput
                id="payment-proof"
                name="payment_proof"
                accept="image/jpeg,image/png,application/pdf"
                value={proofFile}
                disabled={loading}
                onFileChange={setProofFile}
                helperText="Format JPG, PNG, atau PDF maksimal 2MB"
              />
            </div>

            {/* Catatan */}
            <div className="space-y-2 border-t pt-4">
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">Catatan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Contoh: Pembayaran termin 1 atau nomor referensi bank..."
                        {...field}
                        disabled={loading}
                        value={field.value ?? ''}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Batal
                </Button>
              )}
              <Button
                type="submit"
                disabled={loading || !canSubmit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
              >
                {loading ? (
                  'Menyimpan...'
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Simpan Pembayaran
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </CollapsibleBox>
  );
}
