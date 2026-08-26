import { z } from 'zod';

export const goodsReceiptEquipmentSchema = z.object({
  supplierId: z.coerce.number({ required_error: 'Supplier wajib dipilih' }).positive('Supplier wajib dipilih'),
  transactionDate: z.string().min(1, 'Tanggal penerimaan wajib diisi'),
  location: z.string().min(1, 'Lokasi wajib diisi'),
  description: z.string().optional(),
});

export const goodsReceiptEquipmentItemSchema = z.object({
  vehicleEquipmentId: z.coerce.number({ required_error: 'Perlengkapan wajib dipilih' }).positive('Perlengkapan wajib dipilih'),
  qty: z.coerce.number({ required_error: 'QTY wajib diisi' }).positive('QTY wajib lebih besar dari 0'),
  price: z.coerce.number({ required_error: 'Harga wajib diisi' }).nonnegative('Harga wajib lebih besar atau sama dengan 0'),
});

export const goodsReceiptEquipmentPaymentSchema = z.object({
  cashId: z.coerce.number({ required_error: 'Kas wajib dipilih' }).positive('Kas wajib dipilih'),
  amount: z.coerce.number({ required_error: 'Jumlah bayar wajib diisi' }).positive('Jumlah bayar wajib lebih besar dari 0'),
  transactionDate: z.string().min(1, 'Tanggal pembayaran wajib diisi'),
  description: z.string().optional(),
});

export type GoodsReceiptEquipmentFormValues = z.infer<typeof goodsReceiptEquipmentSchema>;
export type GoodsReceiptEquipmentItemFormValues = z.infer<typeof goodsReceiptEquipmentItemSchema>;
export type GoodsReceiptEquipmentPaymentFormValues = z.infer<typeof goodsReceiptEquipmentPaymentSchema>;
