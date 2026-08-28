import { z } from 'zod';

export const doEkspedisiEditSchema = z.object({
  do_order_list_tarif_id: z.coerce.number().min(1, 'Tarif wajib dipilih'),
  uj_nominal: z.coerce.number().min(0, 'Uang jalan wajib diisi'),
  target_start_date: z.date().nullable().optional(),
  target_end_date: z.date().nullable().optional(),
});

export type DoEkspedisiEditSchema = z.input<typeof doEkspedisiEditSchema>;
