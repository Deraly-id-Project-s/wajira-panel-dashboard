import { z } from 'zod';

export const salesSparepartSchema = z.object({
  company_id: z.string().or(z.number()).transform(val => String(val)),
  person_id: z.string().or(z.number()).transform(val => Number(val)).refine(val => val > 0, "Customer wajib diisi"),
  sparepart_id: z.string().or(z.number()).transform(val => Number(val)).refine(val => val > 0, "Sparepart wajib diisi"),
  qty: z.coerce.number().min(1, "Minimal kuantitas adalah 1"),
  price: z.coerce.number().min(0, "Harga tidak valid"),
  discount: z.coerce.number().min(0, "Diskon tidak valid").default(0),
  transaction_date: z.string().min(1, "Tanggal transaksi wajib diisi"),
  nota_number: z.string().min(1, "No Nota wajib diisi"),
  billing_type: z.enum(['cash', 'credit']).default('cash'),
  billing_due_date: z.string().optional().nullable(),
  note: z.string().optional(),
});

export type SalesSparepartFormData = z.infer<typeof salesSparepartSchema>;
