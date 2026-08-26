import { z } from 'zod';

export const kasSchema = z.object({
  code: z.string().min(1, 'Kode wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  type: z.enum(['cash', 'bank'], {
    required_error: 'Jenis wajib dipilih',
  }),
});

export type KasFormValues = z.infer<typeof kasSchema>;
