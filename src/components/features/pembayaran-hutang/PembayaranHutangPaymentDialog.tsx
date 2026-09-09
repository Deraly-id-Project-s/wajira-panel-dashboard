"use client";

import { useEffect, useMemo } from 'react';
import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Paperclip, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePembayaranHutangPayment } from '@/hooks/usePembayaranHutang';
import type { CreateLiabilityPaymentPayload } from '@/types/pembayaran-hutang.types';
import { useCompany } from '@/contexts/CompanyContext';
import { useKas } from '@/hooks/useKas';
import { LoadingState } from '@/components/ui/loading-state';

const resolveCashId = (
  cashes: any[] | undefined,
  paymentType: 'bca_usd' | 'bca_idr' | 'cash_idr'
): number | string | undefined => {
  if (!cashes || !Array.isArray(cashes)) return undefined;

  const findByCode = (keywords: string[], excludeKeywords: string[] = []) => {
    return cashes.find((cash) => {
      const code = String(cash.code ?? '').toLowerCase();
      const desc = String(cash.description ?? '').toLowerCase();

      const matchesKeyword = keywords.some((kw) => code === kw || code.includes(kw) || desc.includes(kw));
      if (!matchesKeyword) return false;

      const matchesExclude = excludeKeywords.some((ex) => code.includes(ex) || desc.includes(ex));
      return !matchesExclude;
    });
  };

  if (paymentType === 'bca_usd') {
    const found = findByCode(['bca_usd', 'usd']);
    return found?.id;
  }

  if (paymentType === 'bca_idr') {
    const found = findByCode(['bca_idr', 'bca'], ['usd']);
    return found?.id;
  }

  if (paymentType === 'cash_idr') {
    const found = findByCode(['cash_idr', 'cash', 'kas'], ['bca']);
    return found?.id;
  }

  return undefined;
};

type FormValues = {
  cash_payment_amount?: string;
  bca_payment_amount?: string;
  bca_payment_usd_amount?: string;
  payment_at?: string;
  note?: string;
  payment_proof?: FileList | null;
};

const currentDate = () => new Date().toISOString().slice(0, 10);

const formatIdrInput = (value: string) => {
  const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseMoneyInput = (value: string) => {
  const normalized = value.replace(/\D/g, '');
  if (!normalized) return 0;

  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : Number.NaN;
};

const createSchema = () =>
  z.object({
    cash_payment_amount: z.string().trim().optional().default(''),
    bca_payment_amount: z.string().trim().optional().default(''),
    bca_payment_usd_amount: z.string().trim().optional().default(''),
    payment_at: z.string().trim().optional().default(''),
    note: z.string().trim().optional().default(''),
    payment_proof: z.any().optional().nullable().default(null),
  });

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billingId: number | null;
  remainingPayment: number;
  code?: string;
}

export default function PembayaranHutangPaymentDialog({ open, onOpenChange, billingId, remainingPayment, code }: Props) {
  const mutation = useCreatePembayaranHutangPayment();
  const schema = useMemo(() => createSchema(), []);
  const { companyId } = useCompany();
  const { data: kasQuery } = useKas(companyId ?? undefined);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cash_payment_amount: '',
      bca_payment_amount: '',
      bca_payment_usd_amount: '',
      payment_at: currentDate(),
      note: '',
      payment_proof: null,
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        cash_payment_amount: '',
        bca_payment_amount: '',
        bca_payment_usd_amount: '',
        payment_at: currentDate(),
        note: '',
        payment_proof: null,
      });
    }
  }, [open, form]);

  const handleSubmit = async (values: FormValues) => {
    if (!billingId) return;

    form.clearErrors();

    const cashAmount = parseMoneyInput(values.cash_payment_amount || '');
    const bcaAmount = parseMoneyInput(values.bca_payment_amount || '');
    const usdAmount = parseMoneyInput(values.bca_payment_usd_amount || '');
    const primaryPayment = cashAmount + bcaAmount;
    const totalPayment = primaryPayment + usdAmount;

    if (!Number.isFinite(cashAmount) || cashAmount < 0) {
      form.setError('cash_payment_amount', { type: 'manual', message: 'Nominal cash tidak valid' });
      return;
    }

    if (!Number.isFinite(bcaAmount) || bcaAmount < 0) {
      form.setError('bca_payment_amount', { type: 'manual', message: 'Nominal BCA tidak valid' });
      return;
    }

    if (!Number.isFinite(usdAmount) || usdAmount < 0) {
      form.setError('bca_payment_usd_amount', { type: 'manual', message: 'Nominal USD tidak valid' });
      return;
    }

    if (primaryPayment <= 0) {
      form.setError('cash_payment_amount', { type: 'manual', message: 'Minimal isi cash atau BCA lebih dari 0' });
      return;
    }

    if (remainingPayment > 0 && totalPayment > remainingPayment) {
      form.setError('cash_payment_amount', { type: 'manual', message: 'Total pembayaran tidak boleh melebihi sisa hutang' });
      return;
    }

    const kasList = kasQuery?.data ?? [];
    let resolvedCashId: string | number | undefined;

    if (cashAmount > 0) {
      resolvedCashId = resolveCashId(kasList, 'cash_idr');
    } else if (bcaAmount > 0) {
      resolvedCashId = resolveCashId(kasList, 'bca_idr');
    } else if (usdAmount > 0) {
      resolvedCashId = resolveCashId(kasList, 'bca_usd');
    }

    const payload: CreateLiabilityPaymentPayload = {
      unit_transaction_billing_id: billingId,
      cash_payment_amount: cashAmount,
      bca_payment_amount: bcaAmount,
      bca_payment_usd_amount: usdAmount,
      payment_at: values.payment_at || undefined,
      note: values.note || undefined,
      payment_proof: values.payment_proof?.[0] ?? null,
      cash_id: resolvedCashId,
    };

    try {
      await mutation.mutateAsync(payload);
      toast.success('Pembayaran berhasil disimpan');
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error(error?.message ?? 'Gagal menyimpan pembayaran');
    }
  };

  const proofFile = form.watch('payment_proof');
  const isBusy = mutation.isPending || form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Pembayaran Hutang</DialogTitle>
          <DialogDescription>
            {code ? `Invoice ${code}` : 'Lengkapi nominal pembayaran dan unggah bukti jika tersedia.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cash Payment</label>
              <Controller
                control={form.control}
                name="cash_payment_amount"
                render={({ field }) => (
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={field.value ?? ''}
                    onChange={(event) => {
                      field.onChange(formatIdrInput(event.target.value));
                      form.clearErrors('cash_payment_amount');
                    }}
                    disabled={isBusy}
                  />
                )}
              />
              {form.formState.errors.cash_payment_amount && <p className="text-xs text-destructive">{form.formState.errors.cash_payment_amount.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">BCA Payment</label>
              <Controller
                control={form.control}
                name="bca_payment_amount"
                render={({ field }) => (
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={field.value ?? ''}
                    onChange={(event) => {
                      field.onChange(formatIdrInput(event.target.value));
                      form.clearErrors('cash_payment_amount');
                    }}
                    disabled={isBusy}
                  />
                )}
              />
              {form.formState.errors.bca_payment_amount && <p className="text-xs text-destructive">{form.formState.errors.bca_payment_amount.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">BCA Payment USD</label>
            <Controller
              control={form.control}
              name="bca_payment_usd_amount"
              render={({ field }) => (
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={field.value ?? ''}
                  onChange={(event) => {
                    field.onChange(formatIdrInput(event.target.value));
                    form.clearErrors('cash_payment_amount');
                  }}
                  disabled={isBusy}
                />
              )}
            />
            {form.formState.errors.bca_payment_usd_amount && <p className="text-xs text-destructive">{form.formState.errors.bca_payment_usd_amount.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Bayar</label>
              <Input type="date" {...form.register('payment_at')} disabled={isBusy} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bukti Pembayaran</label>
              <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <Input type="file" accept="image/*,application/pdf" {...form.register('payment_proof')} className="border-0 px-0 py-0 shadow-none file:mr-2 file:border-0 file:bg-transparent file:text-sm file:font-medium" disabled={isBusy} />
              </div>
              {proofFile?.[0] ? (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Paperclip className="h-3 w-3" />
                  {proofFile[0].name}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Keterangan</label>
            <Textarea placeholder="Catatan pembayaran" {...form.register('note')} disabled={isBusy} />
          </div>

          <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Sisa hutang saat ini: <span className="font-semibold text-foreground">Rp{remainingPayment.toLocaleString('id-ID')}</span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
              Batal
            </Button>
            <Button type="submit" disabled={isBusy || !billingId} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isBusy ? (
                <span className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <LoadingState variant="inline" text={null} />
                  Menyimpan
                </span>
              ) : (
                'Simpan Pembayaran'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
