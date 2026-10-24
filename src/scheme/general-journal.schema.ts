import { z } from 'zod';

const fileField = z
  .custom<File | null | undefined>((value) => {
    if (value === null || value === undefined) return true;
    if (typeof File === 'undefined') return true;
    return value instanceof File;
  }, 'Bukti dokumen tidak valid')
  .optional();

const dateField = z.union([z.date(), z.string()]).pipe(
  z.coerce.date({
    required_error: 'Tanggal wajib diisi',
    invalid_type_error: 'Tanggal wajib diisi',
  }).refine((value) => !Number.isNaN(value.getTime()), 'Tanggal wajib diisi')
);

export const generalJournalBillingSchema = z.object({
  id: z.number().optional(),
  account_id: z.number({ required_error: 'Akun (COA) wajib dipilih' }).min(1, 'Akun (COA) wajib dipilih'),
  type: z.enum(['debet', 'credit'], { required_error: 'Posisi transaksi wajib dipilih' }),
  amount: z.number({ required_error: 'Nominal wajib diisi' }).min(0.01, 'Nominal harus lebih dari 0'),
  amount_original: z.number().min(0.01).optional(),
  payment_at: z.string().optional(),
  note: z.string().optional().nullable(),
});

export const generalJournalSchema = z
  .object({
    company_id: z.number({ required_error: 'Perusahaan wajib dipilih' }).min(1, 'Perusahaan wajib dipilih'),
    date: dateField,
    note: z.string().trim().min(3, 'Keterangan minimal 3 karakter'),
    payment_proof: fileField,
    billings: z.array(generalJournalBillingSchema).min(2, 'Minimal harus terdapat 2 baris transaksi (debet & kredit)'),
  })
  .superRefine((value, ctx) => {
    if (!value.billings || value.billings.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimal harus terdapat 2 baris transaksi jurnal (debet dan kredit)',
        path: ['billings'],
      });
      return;
    }

    let totalDebit = 0;
    let totalCredit = 0;

    value.billings.forEach((item, index) => {
      const amount = Number(item.amount || 0);
      if (item.type === 'debet') {
        totalDebit += amount;
      } else if (item.type === 'credit') {
        totalCredit += amount;
      }
      if (!item.account_id || item.account_id <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Akun wajib dipilih',
          path: ['billings', index, 'account_id'],
        });
      }
    });

    if (totalDebit === 0 && totalCredit === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nominal transaksi tidak boleh 0',
        path: ['billings'],
      });
      return;
    }

    // Periksa keseimbangan (toleransi floating point 0.01)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Jurnal tidak seimbang! Total Debet (Rp ${totalDebit.toLocaleString('id-ID')}) harus sama dengan Total Kredit (Rp ${totalCredit.toLocaleString('id-ID')})`,
        path: ['billings'],
      });
    }
  });

export type GeneralJournalFormValues = z.infer<typeof generalJournalSchema>;
export type GeneralJournalFormInput = z.input<typeof generalJournalSchema>;
