import { z } from 'zod';

export const unitTransactionSchema = z.object({
  unitTypeId: z.string().min(1, 'Tipe Unit wajib dipilih'),
  documentTemplateId: z.union([z.string(), z.number()]).nullable().optional(),
  qty: z.number().min(1, 'QTY minimal 1'),
  price: z.number().min(0, 'Harga tidak boleh negatif'),
  bbnPrice: z.number().min(0).optional(),
  expeditionFee: z.number().min(0).optional(),
  otherFee: z.number().min(0).optional(),
  priceUsd: z.number().min(0).optional(),
  pricePerUnitUsd: z.number().min(0).optional(),
  dppTaxVersionId: z.union([z.string(), z.number()]).optional(),
  ppnTaxVersionId: z.union([z.string(), z.number()]).optional(),
  hppPerUnit: z.number().min(0).optional(),
  dppPerUnit: z.number().min(0).optional(),
  ppnPerUnit: z.number().min(0).optional(),
  hppTotal: z.number().min(0).optional(),
  dppTotal: z.number().min(0).optional(),
  ppnTotal: z.number().min(0).optional(),
});

export type UnitTransactionFormValues = z.infer<typeof unitTransactionSchema>;
