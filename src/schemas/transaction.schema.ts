import { z } from 'zod';

const amountField = z.coerce.number().min(0, 'Nominal tidak boleh negatif').optional();

export const transactionSchema = z
  .object({
    date: z.string().min(1, 'Tanggal wajib diisi'),
    name: z.string().trim().min(3, 'Nama transaksi minimal 3 karakter'),
    debitUSD: amountField,
    creditUSD: amountField,
    debitIDR: amountField,
    creditIDR: amountField,
    debitCash: amountField,
    creditCash: amountField,
    description: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasDebit = Number(data.debitUSD || 0) > 0 || Number(data.debitIDR || 0) > 0 || Number(data.debitCash || 0) > 0;
    const hasCredit = Number(data.creditUSD || 0) > 0 || Number(data.creditIDR || 0) > 0 || Number(data.creditCash || 0) > 0;

    if (!hasDebit && !hasCredit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimal satu nominal debet atau kredit harus diisi',
        path: ['debitUSD'],
      });
    }

    if (hasDebit && hasCredit) {
      (['debitUSD', 'debitIDR', 'debitCash', 'creditUSD', 'creditIDR', 'creditCash'] as const).forEach((field) => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debet dan kredit tidak boleh diisi bersamaan',
          path: [field],
        });
      });
    }
  });

export type TransactionFormValues = z.infer<typeof transactionSchema>;
