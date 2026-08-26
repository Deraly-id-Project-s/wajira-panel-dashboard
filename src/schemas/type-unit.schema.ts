import { z } from 'zod';

export const typeUnitSchema = z.object({
  brandId: z.coerce.number().min(1, 'Brand ID wajib diisi'),
  code: z.string().min(1, 'Kode wajib diisi'),
  name: z.string().min(1, 'Nama wajib diisi'),
  unitType: z.string().optional(),
  unitModel: z.string().optional(),
  brutoWeight: z.number().optional().nullable(),
  nettoWeight: z.number().optional().nullable(),
  capacity: z.number().optional().nullable(),
  image: z.any().optional().nullable(),
  sellPrice: z.number().optional().nullable(),
  buyPrice: z.number().optional().nullable(),
});

export type TypeUnitFormValues = z.infer<typeof typeUnitSchema>;
