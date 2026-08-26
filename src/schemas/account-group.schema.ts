import { z } from 'zod';

export const accountGroupSchema = z.object({
  group_code: z.string().min(1, 'Kode wajib diisi'),
  description: z.string().max(254, 'Deskripsi maksimal 254 karakter').optional(),
});

export type AccountGroupFormValues = z.infer<typeof accountGroupSchema>;
