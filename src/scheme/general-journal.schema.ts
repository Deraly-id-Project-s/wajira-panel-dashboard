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
    is_usd_transaction: z.boolean().default(false),
    amount: z.number().min(0).optional().nullable(),
    amount_original: z.number().min(0).optional().nullable(),
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

    const isUsd = Boolean(value.is_usd_transaction);
    let totalDebit = 0;
    let totalCredit = 0;
    let totalDebitOriginal = 0;
    let totalCreditOriginal = 0;

    value.billings.forEach((item, index) => {
      const amount = Number(item.amount || 0);
      const amountOriginal = item.amount_original !== undefined && item.amount_original !== null
        ? Number(item.amount_original)
        : (isUsd ? 0 : amount);

      if (item.type === 'debet') {
        totalDebit += amount;
        totalDebitOriginal += amountOriginal;
      } else if (item.type === 'credit') {
        totalCredit += amount;
        totalCreditOriginal += amountOriginal;
      }

      if (!item.account_id || item.account_id <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Akun wajib dipilih',
          path: ['billings', index, 'account_id'],
        });
      }

      if (isUsd && (!item.amount_original || Number(item.amount_original) <= 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Nominal IDR (ekuivalen) wajib diisi untuk transaksi USD',
          path: ['billings', index, 'amount_original'],
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

    // Periksa keseimbangan nominal utama (toleransi floating point 0.01)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      const debetFormatted = isUsd
        ? `$ ${totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        : `Rp ${totalDebit.toLocaleString('id-ID')}`;
      const creditFormatted = isUsd
        ? `$ ${totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        : `Rp ${totalCredit.toLocaleString('id-ID')}`;

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Jurnal tidak seimbang! Total Debet (${debetFormatted}) harus sama dengan Total Kredit (${creditFormatted})`,
        path: ['billings'],
      });
    }

    // Untuk transaksi USD, periksa juga keseimbangan nilai nominal IDR
    if (isUsd && Math.abs(totalDebitOriginal - totalCreditOriginal) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Nominal IDR ekuivalen tidak seimbang! Debet (Rp ${totalDebitOriginal.toLocaleString('id-ID')}) harus sama dengan Kredit (Rp ${totalCreditOriginal.toLocaleString('id-ID')})`,
        path: ['billings'],
      });
    }
  });

export type GeneralJournalFormValues = z.infer<typeof generalJournalSchema>;
export type GeneralJournalFormInput = z.input<typeof generalJournalSchema>;
