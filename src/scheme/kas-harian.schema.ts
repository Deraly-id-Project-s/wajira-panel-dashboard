import { z } from 'zod';

const fileField = z
  .custom<File | null | undefined>((value) => {
    if (value === null || value === undefined) return true;
    if (typeof File === 'undefined') return true;
    return value instanceof File;
  }, 'Bukti pembayaran tidak valid')
  .optional();

const dateField = z.preprocess((value) => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    return new Date(value);
  }
  return value;
}, z.date({ required_error: 'Tanggal wajib diisi', invalid_type_error: 'Tanggal wajib diisi' }).refine((value) => !Number.isNaN(value.getTime()), 'Tanggal wajib diisi'));

export const cashFlowCashSchema = z.object({
  id: z.number().optional(),
  cash_id: z.number({ required_error: 'Kas wajib dipilih' }).min(1, 'Kas wajib dipilih'),
  amount: z.number({ required_error: 'Nominal wajib diisi' }).min(0.01, 'Nominal harus lebih dari 0'),
  conversion_amount: z.number().min(0, 'Nominal konversi tidak valid').optional().nullable(),
  type: z.enum(['debet', 'credit'], { required_error: 'Tipe transaksi wajib dipilih' }),
});

export const kasHarianSchema = z
  .object({
    company_id: z.number({ required_error: 'Perusahaan wajib dipilih' }).min(1, 'Perusahaan wajib dipilih'),
    date: dateField,
    note: z.string().trim().min(3, 'Keterangan minimal 3 karakter'),
    debet: z.number().min(0).default(0),
    debet_usd: z.number().min(0).default(0),
    credit: z.number().min(0).default(0),
    credit_usd: z.number().min(0).default(0),
    cash_flow_cashes: z.array(cashFlowCashSchema).min(1, 'Minimal satu rincian kas transaksi harus diisi'),
    payment_proof: fileField,
  })
  .superRefine((value, ctx) => {
    if (!value.cash_flow_cashes || value.cash_flow_cashes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimal satu rincian kas transaksi harus diisi',
        path: ['cash_flow_cashes'],
      });
      return;
    }

    const types = new Set(value.cash_flow_cashes.map((item) => item.type));
    if (types.has('debet') && types.has('credit')) {
      value.cash_flow_cashes.forEach((_item, index) => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tipe transaksi harus seragam (seluruhnya Debit atau seluruhnya Kredit)',
          path: ['cash_flow_cashes', index, 'type'],
        });
      });
    }
  });

export type KasHarianFormValues = z.infer<typeof kasHarianSchema>;
export type KasHarianFormInput = z.input<typeof kasHarianSchema>;
