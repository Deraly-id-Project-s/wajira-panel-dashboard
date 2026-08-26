'use client';

import {
  SparepartTransactionForm,
  type SparepartTransactionFormData,
} from './SparepartTransactionForm';
import { SalesSparepartFormData } from './sales-sparepart.schema';

interface Props {
  defaultValues?: Partial<SalesSparepartFormData>;
  onSubmit: (data: SalesSparepartFormData) => void;
  onCancel: () => void;
  readOnly?: boolean;
  companyId?: string | null;
  loading?: boolean;
}

export function SalesSparepartForm({
  defaultValues,
  onSubmit,
  onCancel,
  readOnly,
  companyId,
  loading,
}: Props) {
  return (
    <SparepartTransactionForm
      type="sales"
      defaultValues={defaultValues as Partial<SparepartTransactionFormData>}
      onSubmit={onSubmit as (data: SparepartTransactionFormData) => void}
      onCancel={onCancel}
      readOnly={readOnly}
      companyId={companyId}
      loading={loading}
    />
  );
}
