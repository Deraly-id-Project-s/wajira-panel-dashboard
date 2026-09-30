import { z } from 'zod';

export const vehicleEquipmentSchema = z.object({
  code: z.string().min(1, 'Kode wajib diisi'),
  name: z.string().min(1, 'Nama wajib diisi'),
  description: z.string().optional().nullable(),
  buy_price: z.coerce.number().min(0, 'Harga beli tidak boleh kurang dari 0').default(0),
  sell_price: z.coerce.number().min(0, 'Harga jual tidak boleh kurang dari 0').default(0),
});

export type VehicleEquipmentFormInput = z.input<typeof vehicleEquipmentSchema>;
export type VehicleEquipmentFormValues = z.output<typeof vehicleEquipmentSchema>;
