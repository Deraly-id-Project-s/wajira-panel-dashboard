import { z } from 'zod';

export const goodsIssueEquipmentSchema = z.object({
  vehicleFleetId: z.coerce.number({ required_error: 'Nomor Polisi wajib dipilih' }).positive('Nomor Polisi wajib dipilih'),
  driverId: z.coerce.number({ required_error: 'Driver wajib dipilih' }).positive('Driver wajib dipilih'),
  transactionDate: z.string().min(1, 'Tanggal pengeluaran wajib diisi'),
  description: z.string().optional(),
  category: z.enum(['equipped', 'maintenance']),
});

export const goodsIssueEquipmentItemSchema = z.object({
  vehicleEquipmentId: z.coerce.number({ required_error: 'Perlengkapan wajib dipilih' }).positive('Perlengkapan wajib dipilih'),
  qty: z.coerce.number({ required_error: 'QTY wajib diisi' }).positive('QTY wajib lebih besar dari 0'),
  description: z.string().optional(),
});

export type GoodsIssueEquipmentFormValues = z.infer<typeof goodsIssueEquipmentSchema>;
export type GoodsIssueEquipmentItemFormValues = z.infer<typeof goodsIssueEquipmentItemSchema>;
