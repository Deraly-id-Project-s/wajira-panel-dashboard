import { z } from 'zod';

export const createRefundSchema = z.object({
  unit_transaction_id: z.string().min(1, 'Transaksi wajib dipilih'),
  refund_date: z.string().min(1, 'Tanggal refund wajib diisi'),
  refund_amount: z.coerce.number().min(1, 'Nominal refund harus lebih dari 0'),
  note: z.string().optional(),
  unit_transaction_item_detail_ids: z.array(z.coerce.number()).optional().default([]),
});

export type CreateRefundFormValues = z.infer<typeof createRefundSchema>;

export const createRefundPaymentSchema = z.object({
  unit_transaction_refund_id: z.string().min(1, 'Refund ID wajib ada'),
  amount: z.coerce.number().min(1, 'Nominal pembayaran harus lebih dari 0'),
  payment_date: z.string().min(1, 'Tanggal pembayaran wajib diisi'),
  note: z.string().optional(),
  cash_id: z.string().optional(),
});

export type CreateRefundPaymentFormValues = z.infer<typeof createRefundPaymentSchema>;

export const updateRefundPaidStatusSchema = z.object({
  is_paid: z.boolean(),
  note: z.string().optional(),
});

export type UpdateRefundPaidStatusFormValues = z.infer<typeof updateRefundPaidStatusSchema>;

export const createFinanceRefundBillingSchema = (remainingPayment: number) =>
  z.object({
    finance_refund_id: z.number().min(1, 'Finance refund ID wajib ada'),
    cash_id: z.number().min(1, 'Pilih akun kas/bank'),
    account_id: z.number().optional().nullable(),
    amount: z
      .number({ invalid_type_error: 'Nominal harus berupa angka' })
      .min(0.01, 'Nominal minimal 0.01')
      .max(
        remainingPayment > 0 ? remainingPayment : 0.01,
        `Nominal tidak boleh melebihi sisa tagihan (${(remainingPayment || 0).toLocaleString('id-ID')})`,
      ),
    payment_at: z.string().min(1, 'Tanggal pembayaran wajib diisi'),
    note: z.string().optional(),
  });

export type CreateFinanceRefundBillingFormValues = z.infer<ReturnType<typeof createFinanceRefundBillingSchema>>;

export const financeApprovalRefundSchema = z.object({
  status: z.enum(['waiting', 'approve', 'reject'], {
    required_error: 'Status wajib dipilih',
  }),
  cash_id: z.string().optional(), // Bisa opsional jika reject
}).refine(data => {
  if (data.status === 'approve' && !data.cash_id) {
    return false;
  }
  return true;
}, {
  message: 'Kas/Bank wajib dipilih jika status approve',
  path: ['cash_id'],
});

export type FinanceApprovalRefundFormValues = z.infer<typeof financeApprovalRefundSchema>;
