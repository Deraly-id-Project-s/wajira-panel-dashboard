import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'Nama customer wajib diisi'),
  // address: z.string().min(1, 'Alamat wajib diisi'),
  address: z.string().min(1, 'Alamat wajib diisi'),
  // npwp: z.string().min(1, 'NPWP wajib diisi'),
  npwp: z.string().min(1, 'NPWP wajib diisi'),
  pic: z.string().optional(),
  // phone: z.string().min(1, 'Nomer telepon wajib diisi'),
  phone: z.string().min(1, 'Nomer telepon wajib diisi'),
  map_link: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
