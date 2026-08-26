import { z } from 'zod';

export const materialTransactionSchema = z.object({
  warehouseId: z.coerce.number({ required_error: 'Warehouse wajib dipilih' }).positive('Warehouse wajib dipilih'),
  supplierName: z.string().min(1, 'Nama supplier wajib diisi'),
  transactionDate: z.string().min(1, 'Tanggal pembelian wajib diisi'),
  description: z.string().optional(),
});

export const materialTransactionItemSchema = z.object({
  orderCode: z.string().min(1, 'Nomor pembelian wajib diisi'),
  materialId: z.number({ required_error: 'Material wajib dipilih' }).positive('Material wajib dipilih'),
  qty: z.coerce.number({ required_error: 'QTY wajib diisi' }).positive('QTY wajib lebih besar dari 0'),
  price: z.coerce.number({ required_error: 'Harga wajib diisi' }).nonnegative('Harga tidak boleh negatif'),
  description: z.string().optional(),
});

export const materialTransactionBillingSchema = z.object({
  cashId: z.number({ required_error: 'Pembayaran wajib dipilih' }).positive('Pembayaran wajib dipilih'),
  amount: z.coerce.number({ required_error: 'Nominal pembayaran wajib diisi' }).positive('Nominal pembayaran wajib lebih besar dari 0'),
  paymentDate: z.string().min(1, 'Tanggal bayar wajib diisi'),
  description: z.string().optional(),
});

export type MaterialTransactionFormValues = z.infer<typeof materialTransactionSchema>;
export type MaterialTransactionItemFormValues = z.infer<typeof materialTransactionItemSchema>;
export type MaterialTransactionBillingFormValues = z.infer<typeof materialTransactionBillingSchema>;
