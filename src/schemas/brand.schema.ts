import { z } from 'zod';

export const brandSchema = z.object({
    name: z.string().min(1, 'Nama wajib diisi'),
    image: z.any().optional(),
});

export type BrandFormValues = z.infer<typeof brandSchema>;
