import type { z } from 'zod';
import type { unitTransactionSchema } from '@/scheme/unit-transaction.schema';

export type UnitTransactionKind = 'purchase' | 'sales';
export type UnitTransactionFormValues = z.infer<typeof unitTransactionSchema>;
