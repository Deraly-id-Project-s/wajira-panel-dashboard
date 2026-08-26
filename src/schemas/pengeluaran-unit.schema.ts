import { z } from 'zod';

const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;

export const warehouseOptionSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string(),
});

export const personOptionSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string(),
});

export const pengeluaranUnitSchema = z.object({
  id: z.coerce.number().int().positive(),
  uuid: z.string().optional().default(''),
  person_id: z.coerce.number().int().nullable().optional(),
  warehouse_id: z.coerce.number().int().nullable().optional(),
  activity_number: z.string(),
  activity_type: z.enum(['issue', 'receipt']),
  activity_date: z.string(),
  description: z.string().nullable().optional(),
  created_at: z.string().optional().default(''),
  state: z.string().optional().default(''),
  warehouse: warehouseOptionSchema.nullable().optional(),
  person: personOptionSchema.nullable().optional(),
});

export const pengeluaranUnitListDataSchema = z.object({
  current_page: z.coerce.number().int().min(1),
  data: z.array(pengeluaranUnitSchema),
  last_page: z.coerce.number().int().min(1),
  per_page: z.coerce.number().int().min(1),
  total: z.coerce.number().int().min(0),
});

export const pengeluaranUnitFormSchema = z.object({
  personId: z.coerce.number().int().positive('Supplier wajib dipilih'),
  warehouseId: z.coerce.number().int().positive('Warehouse wajib dipilih'),
  activityDate: z.date({ required_error: 'Tanggal wajib diisi' }),
  description: z.string().max(500, 'Keterangan maksimal 500 karakter').default(''),
});

export const savePengeluaranUnitSchema = z.object({
  personId: z.coerce.number().int().positive(),
  warehouseId: z.coerce.number().int().positive(),
  activityDate: z.string().regex(ymdRegex, 'Format tanggal harus YYYY-MM-DD'),
  description: z.string().max(500).optional(),
});

export type PengeluaranUnitFormSchemaValues = z.input<typeof pengeluaranUnitFormSchema>;
export type PengeluaranUnitFormSchemaSubmitValues = z.output<typeof pengeluaranUnitFormSchema>;
export type SavePengeluaranUnitSchemaValues = z.infer<typeof savePengeluaranUnitSchema>;
