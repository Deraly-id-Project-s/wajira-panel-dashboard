import { z } from 'zod';

export const vehicleEquipmentPriceVersionSchema = z.object({
  name: z.string().min(1, 'Nama versi wajib diisi'),
  buy_price: z.coerce.number().min(0, 'Harga beli tidak boleh kurang dari 0'),
  sell_price: z.coerce.number().min(0, 'Harga jual tidak boleh kurang dari 0'),
  effective_from: z.string().optional().nullable(),
  effective_until: z.string().optional().nullable(),
  is_default: z.boolean().default(false),
  is_lock: z.boolean().optional(),
});

export type VehicleEquipmentPriceVersionFormValues = z.infer<typeof vehicleEquipmentPriceVersionSchema>;
