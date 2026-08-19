import { z } from 'zod';

const orderListCargoItemSchema = z.object({
  localId: z.string(),
  id: z.number().optional(),
  loadContent: z.string().trim().min(1, 'Muatan wajib diisi'),
  qty: z.coerce.number().int('Qty harus berupa bilangan bulat').min(1, 'Qty minimal 1'),
});

const orderListItemSchema = z.object({
  localId: z.string(),
  id: z.number().optional(),
  tarifId: z.string().min(1, 'Tarif wajib dipilih'),
  vehicleType: z.enum(['towing', 'cdd', 'fuso']),
  loadingIn: z.string().trim().min(1, 'Loading in wajib terisi'),
  loadingOut: z.string().trim().min(1, 'Loading out wajib terisi'),
  deliveryDestination: z.string().trim().min(1, 'Tujuan kirim wajib diisi'),
  cargoItems: z.array(orderListCargoItemSchema).min(1, 'Minimal satu item muatan'),
  driverFee: z.coerce.number().min(0),
  expeditionInvoice: z.coerce.number().min(0),
});

export const orderListFormSchema = z.object({
  customerId: z.string().min(1, 'Customer wajib dipilih'),
  status: z.enum(['deliver', 'process', 'pending', 'reject']),
  invoiceBill: z.coerce.number().min(0),
  ppn: z.coerce.number().min(0),
  pph: z.coerce.number().min(0).optional(),
  ujDriver: z.coerce.number().min(0),
  note: z.string().optional().default(''),
  items: z.array(orderListItemSchema).min(1, 'Minimal satu tarif harus ditambahkan'),
});

export type OrderListFormSchema = z.input<typeof orderListFormSchema>;
