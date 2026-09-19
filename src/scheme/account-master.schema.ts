import { z } from 'zod';

export const accountSchema = z.object({
  accountGroupId: z.number({ required_error: 'Grup akun wajib dipilih' }).positive('Grup akun wajib dipilih'),
  code: z.string().min(1, 'Kode akun wajib diisi').max(50, 'Kode akun maksimal 50 karakter'),
  name: z.string().min(1, 'Nama akun wajib diisi').max(255, 'Nama akun maksimal 255 karakter'),
  description: z.string().optional().nullable(),
  type: z.enum(['debet', 'credit'], { required_error: 'Tipe akun wajib dipilih' }),
  pos_code: z.string().max(50, 'Kode pos maksimal 50 karakter').optional().nullable(),
  category: z.enum(['general', 'operational', 'director_receivable', 'shareholder_receivable', 'receivable', 'inventory'], {
    invalid_type_error: 'Kategori laporan tidak valid',
  }).optional().nullable(),
  isActive: z.boolean().optional(),
  is_lock: z.boolean().optional(),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
