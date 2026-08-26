'use client';

import {
  SparepartTransactionForm,
  type SparepartTransactionFormData,
} from './SparepartTransactionForm';
import { PurchaseSparepartFormData } from './purchase-sparepart.schema';

interface Props {
  defaultValues?: Partial<PurchaseSparepartFormData>;
  onSubmit: (data: PurchaseSparepartFormData) => void;
  onCancel: () => void;
  readOnly?: boolean;
  companyId?: string | null;
  loading?: boolean;
}

export function PurchaseSparepartForm({
  defaultValues,
  onSubmit,
  onCancel,
  readOnly,
  companyId,
  loading,
}: Props) {
  return (
    <SparepartTransactionForm
      type="purchase"
      defaultValues={defaultValues as Partial<SparepartTransactionFormData>}
      onSubmit={onSubmit as (data: SparepartTransactionFormData) => void}
      onCancel={onCancel}
      readOnly={readOnly}
      companyId={companyId}
      loading={loading}
    />
  );
}
