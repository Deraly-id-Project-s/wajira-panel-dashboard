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

export const generalJournalSchema = z
  .object({
    company_id: z.number({ required_error: 'Perusahaan wajib dipilih' }).min(1, 'Perusahaan wajib dipilih'),
    date: dateField,
    type: z.enum(['debit', 'credit', 'debet', 'kredit']).default('debit'),
    note: z.string().trim().min(3, 'Keterangan minimal 3 karakter'),
    payment_proof: fileField,
    is_usd_transaction: z.boolean().default(false),
    amount: z.number().min(0).optional().nullable(),
    amount_original: z.number().min(0).optional().nullable(),
    billings: z.array(generalJournalBillingItemSchema).min(1, 'Minimal harus terdapat 1 item billing'),
  })
  .superRefine((value, ctx) => {
    if (!value.billings || value.billings.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimal harus terdapat 1 item billing',
        path: ['billings'],
      });
      return;
    }

    const seenCashIds = new Set<number>();
    let grandTotalCash = 0;

    value.billings.forEach((billing, bIndex) => {
      if (!billing.cashes || billing.cashes.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Minimal harus terdapat 1 alokasi kas pada billing ini',
          path: ['billings', bIndex, 'cashes'],
        });
        return;
      }

      billing.cashes.forEach((cash, cIndex) => {
        const cid = Number(cash.cash_id);
        if (!cid || cid <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Kas / Bank wajib dipilih',
            path: ['billings', bIndex, 'cashes', cIndex, 'cash_id'],
          });
        } else if (seenCashIds.has(cid)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Kas / Bank ini sudah dipilih di baris lain. Setiap data kas harus bersifat unik per jurnal.',
            path: ['billings', bIndex, 'cashes', cIndex, 'cash_id'],
          });
        } else {
          seenCashIds.add(cid);
        }

        if (!cash.amount || cash.amount <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Nominal kas harus lebih dari 0',
            path: ['billings', bIndex, 'cashes', cIndex, 'amount'],
          });
        }
        grandTotalCash += Number(cash.amount || 0);
      });
    });

    if (grandTotalCash <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Total nominal kas tidak boleh 0',
        path: ['billings'],
      });
    }
  });

export const generalJournalBillingPaymentSchema = z.object({
  general_journal_billing_id: z.number({ required_error: 'Billing ID wajib ada' }).min(1),
  account_id: z.number({ required_error: 'Akun (COA) wajib dipilih' }).min(1, 'Akun (COA) wajib dipilih'),
  amount: z.number({ required_error: 'Nominal pembayaran wajib diisi' }).min(0.01, 'Nominal harus lebih dari 0'),
  amount_original: z.number().min(0).optional().nullable(),
  note: z.string().trim().optional().nullable(),
  transaction_proof: fileField,
});

export type GeneralJournalFormValues = z.infer<typeof generalJournalSchema>;
export type GeneralJournalFormInput = z.input<typeof generalJournalSchema>;
export type GeneralJournalBillingPaymentFormValues = z.infer<typeof generalJournalBillingPaymentSchema>;
