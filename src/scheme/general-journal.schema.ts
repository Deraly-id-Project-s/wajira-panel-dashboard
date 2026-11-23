import { z } from 'zod';

const fileField = z
  .custom<File | null | undefined>((value) => {
    if (value === null || value === undefined) return true;
    if (typeof File === 'undefined') return true;
    return value instanceof File;
  }, 'Bukti dokumen tidak valid')
  .optional();

const dateField = z.union([z.date(), z.string()]).pipe(
  z.coerce
    .date({
      required_error: 'Tanggal wajib diisi',
      invalid_type_error: 'Tanggal wajib diisi',
    })
    .refine((value) => !Number.isNaN(value.getTime()), 'Tanggal wajib diisi'),
);

export const generalJournalCashSchema = z.object({
  id: z.number().optional(),
  cash_id: z.number({ required_error: 'Kas / Bank wajib dipilih' }).min(1, 'Kas / Bank wajib dipilih'),
  amount: z.number({ required_error: 'Nominal kas wajib diisi' }).min(0.01, 'Nominal harus lebih dari 0'),
  type: z.enum(['debit', 'credit', 'debet', 'kredit']).default('debit'),
});

export const generalJournalBillingItemSchema = z.object({
  id: z.number().optional(),
  date: dateField.optional(),
  note: z.string().optional().nullable(),
  cashes: z.array(generalJournalCashSchema).min(1, 'Minimal harus terdapat 1 alokasi kas'),
});

export const generalJournalPaymentDirectSchema = z.object({
  id: z.number().optional(),
  account_id: z.number({ required_error: 'Akun (COA) wajib dipilih' }).min(1, 'Akun (COA) wajib dipilih'),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  type: z.enum(['debit', 'credit', 'debet', 'kredit']).optional(),
  amount: z.number().min(0).default(0),
  amount_original: z.number().min(0).optional().nullable(),
  note: z.string().optional().nullable(),
});

export const generalJournalSchema = z
  .object({
    company_id: z.number({ required_error: 'Perusahaan wajib dipilih' }).min(1, 'Perusahaan wajib dipilih'),
    date: dateField,
    type: z.enum(['debit', 'credit', 'debet', 'kredit']).default('debit'),
    note: z.string().trim().min(3, 'Keterangan minimal 3 karakter'),
    payment_proof: fileField,
    is_usd_transaction: z.boolean().default(false),
    is_paid: z.boolean().default(false),
    amount: z.number({ required_error: 'Nominal jurnal wajib diisi' }).min(1, 'Nominal jurnal harus lebih dari 0'),
    amount_original: z.number().min(0).optional().nullable(),
    billings: z.array(generalJournalBillingItemSchema).optional().default([]),
    payments: z.array(generalJournalPaymentDirectSchema).min(1, 'Minimal harus terdapat 1 baris rincian pembayaran jurnal'),
  })
  .superRefine((value, ctx) => {
    const targetAmount = Number(value.amount || 0);
    if (!targetAmount || targetAmount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nominal jurnal umum wajib diisi dan harus lebih dari 0',
        path: ['amount'],
      });
    }

    if (!value.payments || value.payments.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimal harus terdapat 1 baris rincian pembayaran jurnal',
        path: ['payments'],
      });
      return;
    }

    let totalDebit = 0;
    let totalCredit = 0;

    (value.payments || []).forEach((p, pIndex) => {
      const accId = Number(p.account_id);
      const deb = Number(p.debit || 0);
      const cred = Number(p.credit || 0);

      totalDebit += deb;
      totalCredit += cred;

      if (!accId || accId <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Akun (COA) wajib dipilih',
          path: ['payments', pIndex, 'account_id'],
        });
      }

      if (deb <= 0 && cred <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Salah satu nominal (Debit atau Kredit) wajib diisi',
          path: ['payments', pIndex, 'debit'],
        });
      }

      if (deb > 0 && cred > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Wajib memilih salah satu antara Debit atau Kredit, tidak boleh keduanya',
          path: ['payments', pIndex, 'credit'],
        });
      }
    });

    if (targetAmount > 0) {
      if (totalDebit > targetAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Total pembayaran debit tidak boleh melebihi nominal jurnal umum`,
          path: ['amount'],
        });
      }

      if (totalCredit > targetAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Total pembayaran kredit tidak boleh melebihi nominal jurnal umum`,
          path: ['amount'],
        });
      }

      const journalType = value.type === 'credit' || value.type === 'kredit' ? 'credit' : 'debit';
      if (journalType === 'debit' && totalDebit < targetAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Pembayaran debit wajib lunas sesuai nominal jurnal umum`,
          path: ['amount'],
        });
      } else if (journalType === 'credit' && totalCredit < targetAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Pembayaran kredit wajib lunas sesuai nominal jurnal umum`,
          path: ['amount'],
        });
      }
    }
  });

export const generalJournalBillingPaymentSchema = z.object({
  general_journal_billing_id: z.number({ required_error: 'Billing ID wajib ada' }).min(1),
  account_id: z.number({ required_error: 'Akun (COA) wajib dipilih' }).min(1, 'Akun (COA) wajib dipilih'),
  type: z.enum(['debit', 'credit'], { required_error: 'Tipe pembayaran wajib dipilih' }).default('debit'),
  amount: z.number({ required_error: 'Nominal pembayaran wajib diisi' }).min(0.01, 'Nominal harus lebih dari 0'),
  amount_original: z.number().min(0).optional().nullable(),
  note: z.string().trim().optional().nullable(),
  transaction_proof: fileField,
});

export type GeneralJournalFormValues = z.infer<typeof generalJournalSchema>;
export type GeneralJournalFormInput = z.input<typeof generalJournalSchema>;
export type GeneralJournalBillingPaymentFormValues = z.infer<typeof generalJournalBillingPaymentSchema>;
