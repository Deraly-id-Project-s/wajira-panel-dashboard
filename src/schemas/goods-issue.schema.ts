import { z } from 'zod';

export const goodsIssueSchema = z.object({
  customerId: z.coerce.number({ required_error: 'Customer wajib dipilih' }).positive('Customer wajib dipilih'),
  transactionDate: z.string().min(1, 'Tanggal pengeluaran wajib diisi'),
  description: z.string().optional(),
});

export const goodsIssueItemSchema = z.object({
  materialId: z.coerce.number({ required_error: 'Material wajib dipilih' }).positive('Material wajib dipilih'),
  qty: z.coerce.number({ required_error: 'QTY wajib diisi' }).positive('QTY wajib lebih besar dari 0'),
  type: z.enum(['pcs', 'set', 'box'], { required_error: 'Satuan wajib dipilih' }),
  price: z.coerce.number({ required_error: 'Harga wajib diisi' }).nonnegative('Harga tidak boleh negatif'),
  description: z.string().optional(),
});

export const goodsIssuePaymentSchema = z.object({
  cashId: z.coerce.number({ required_error: 'Pembayaran wajib dipilih' }).positive('Pembayaran wajib dipilih'),
  amount: z.coerce.number({ required_error: 'Nominal pembayaran wajib diisi' }).positive('Nominal pembayaran wajib lebih besar dari 0'),
  transactionDate: z.string().min(1, 'Tanggal bayar wajib diisi'),
  description: z.string().optional(),
});

export type GoodsIssueFormValues = z.infer<typeof goodsIssueSchema>;
export type GoodsIssueItemFormValues = z.infer<typeof goodsIssueItemSchema>;
export type GoodsIssuePaymentFormValues = z.infer<typeof goodsIssuePaymentSchema>;
