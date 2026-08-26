import { z } from 'zod';

export const documentTemplateSchema = z.object({
  name: z.string().trim().min(1, 'Nama template wajib diisi'),
  language: z.enum(['id', 'en']),
  subject: z.string().trim().min(1, 'Subject wajib diisi'),
  headerInformation: z.string().trim().min(1, 'Informasi header wajib diisi'),
  footerInformation: z.string().trim().min(1, 'Informasi footer wajib diisi'),
  tableColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Warna tabel tidak valid'),
  personSignature: z.any().nullable().optional(),
  personSigner: z.string().trim().min(1, 'Penandatangan wajib diisi'),
  documentTemplate: z.any().nullable().optional(),
});

export type DocumentTemplateFormValues = z.infer<typeof documentTemplateSchema>;
