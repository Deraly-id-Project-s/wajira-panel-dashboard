import { z } from 'zod';

const toOptionalString = (schema: z.ZodString) => z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : val), schema.optional());

const passwordSchema = z.string()
  .min(8, 'Password minimal 8 karakter')
  .max(253, 'Password maksimal 253 karakter')
  .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
  .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
  .regex(/[0-9]/, 'Password harus mengandung angka')
  .regex(/[^a-zA-Z0-9]/, 'Password harus mengandung karakter unik/spesial');

const baseUserShape = {
  name: z.string().optional(),
  email: z.string().email('Email tidak valid'),
  username: z.string()
    .min(3, 'Username minimal 3 karakter')
    .regex(/^\S+$/, 'Username tidak boleh mengandung spasi')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh berisi huruf, angka, dan underscore'),
  firstname: z.string().min(1, 'Nama depan wajib diisi'),
  lastname: z.string().optional(),
  roles: z.string().optional(),
  is_active: z.union([z.string(), z.boolean()]).optional(),
  company_ids: z.array(z.number()).optional(),
};

// Create: password wajib
export const createUserSchema = z.object({
  ...baseUserShape,
  password: passwordSchema,
  password_confirmation: z.string().min(1, 'Konfirmasi password wajib diisi'),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Konfirmasi password tidak sama',
  path: ['password_confirmation'],
});

// Update: password opsional, bisa dikosongkan
export const updateUserSchema = z.object({
  ...baseUserShape,
  password: toOptionalString(passwordSchema),
  password_confirmation: toOptionalString(z.string()),
}).partial().refine((data) => {
  if (data.password && !data.password_confirmation) {
    return false;
  }
  return true;
}, {
  message: 'Konfirmasi password wajib diisi jika password diubah',
  path: ['password_confirmation'],
}).refine((data) => {
  if (data.password && data.password_confirmation && data.password !== data.password_confirmation) {
    return false;
  }
  return true;
}, {
  message: 'Konfirmasi password tidak sama',
  path: ['password_confirmation'],
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
