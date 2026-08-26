import { z } from 'zod';

const toOptionalNumber = (value: unknown) => {
  if (value === '' || value === null || value === undefined) return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

export const ppnSchema = z.object({
  kodeBeli: z.string().optional(),
  noMesin: z.string().min(1, 'No Mesin wajib diisi'),
  tanggalFPM: z.date({ required_error: 'Tanggal FPM wajib diisi' }),
  masaNSFPM: z.date({ required_error: 'Masa NSFPM wajib diisi' }),
  nsfpmMasukan: z.string().min(1, 'NSFPM Masukan wajib diisi'),
  biaya: z.preprocess((val) => toOptionalNumber(val), z.number().optional()),
});

export type PPNFormValues = z.infer<typeof ppnSchema>;

export const bulkUpdatePPNSchema = z.object({
  ppn_data_ids: z.array(z.number()).min(1, 'Pilih setidaknya satu data PPN'),
  fp_date: z.string().optional(),
  nsfp_age: z.string().optional(),
  nsfp_amount: z.preprocess((val) => toOptionalNumber(val), z.number().optional()),
  amount: z.preprocess((val) => toOptionalNumber(val), z.number().optional()),
  nsfp_number: z.string().optional(),
});

export type BulkUpdatePPNFormValues = z.infer<typeof bulkUpdatePPNSchema>;

// Convenient aliases for Pembelian & Penjualan
export const ppnPembelianSchema = ppnSchema;
export const ppnPenjualanSchema = ppnSchema;
export type PPNPembelianFormValues = PPNFormValues;
export type PPNPenjualanFormValues = PPNFormValues;

export const bulkUpdatePPNPembelianSchema = bulkUpdatePPNSchema;
export const bulkUpdatePPNPenjualanSchema = bulkUpdatePPNSchema;
export type BulkUpdatePPNPembelianFormValues = BulkUpdatePPNFormValues;
export type BulkUpdatePPNPenjualanFormValues = BulkUpdatePPNFormValues;
