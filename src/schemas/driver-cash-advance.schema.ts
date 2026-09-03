import { z } from 'zod';

export const driverCashAdvanceSchema = z.object({
  companyId: z.number({ required_error: 'Perusahaan wajib dipilih' }).min(1, 'Perusahaan wajib dipilih'),
  driverId: z.string().trim().min(1, 'Driver wajib dipilih'),
  subject: z.string().trim().min(3, 'Subject minimal 3 karakter'),
  description: z.string().optional(),
  claimNominal: z.number({ required_error: 'Nominal wajib diisi' }).min(1, 'Nominal wajib lebih dari 0'),
  claimDate: z.string().trim().min(1, 'Tanggal klaim wajib diisi'),
});

export type DriverCashAdvanceFormValues = z.infer<typeof driverCashAdvanceSchema>;
