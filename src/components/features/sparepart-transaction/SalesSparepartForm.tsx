'use client';

import { SparepartForm, type SparepartFormProps, type SparepartTransactionFormData } from './SparepartForm';
import type { SalesSparepartFormData } from './sales-sparepart.schema';

export interface SalesSparepartFormProps extends Omit<SparepartFormProps, 'type'> {}

export function SalesSparepartForm(props: SalesSparepartFormProps) {
  return <SparepartForm type="sales" {...props} />;
}

export type { SalesSparepartFormData, SparepartTransactionFormData };
