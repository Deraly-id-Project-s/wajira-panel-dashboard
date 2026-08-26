import { z } from 'zod';

export const accountSchema = z.object({
  accountGroupId: z.number({ required_error: 'Grup akun wajib dipilih' }).positive('Grup akun wajib dipilih'),
  code: z.string().min(1, 'Kode akun wajib diisi'),
  name: z.string().min(1, 'Nama akun wajib diisi'),
  description: z.string().optional(),
  category: z.enum(['general', 'operational', 'director_receivable', 'shareholder_receivable', 'receivable', 'inventory']).optional().nullable(),
  isActive: z.boolean(),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
