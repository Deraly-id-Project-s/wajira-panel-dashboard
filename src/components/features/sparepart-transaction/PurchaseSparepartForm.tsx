'use client';

import { SparepartForm, type SparepartFormProps, type SparepartTransactionFormData } from './SparepartForm';
import type { PurchaseSparepartFormData } from './purchase-sparepart.schema';

export interface PurchaseSparepartFormProps extends Omit<SparepartFormProps, 'type'> {}

export function PurchaseSparepartForm(props: PurchaseSparepartFormProps) {
  return <SparepartForm type="purchase" {...props} />;
}

export type { PurchaseSparepartFormData, SparepartTransactionFormData };
