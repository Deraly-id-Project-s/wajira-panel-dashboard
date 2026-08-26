'use client';

import {
  UnitTransactionRefundForm,
  type UnitTransactionRefundFormValues,
} from '@/components/features/unit-transaction/UnitTransactionRefundForm';
import { UnitTransactionDetail, UnitTransactionItemDetail } from '@/types/unit-transaction.types';
import { Kas } from '@/types/kas.types';

export type PurchaseRefundFormValues = UnitTransactionRefundFormValues;

interface Props {
  purchase: UnitTransactionDetail;
  totalPaid: number;
  unitItemDetails: UnitTransactionItemDetail[];
  unitItemDetailsLoading?: boolean;
  cashOptions: Kas[];
  submitting?: boolean;
  disabled?: boolean;
  onCancel: () => void;
  onSubmit: (values: PurchaseRefundFormValues) => Promise<void>;
}

export function PurchaseRefundForm({
  purchase,
  totalPaid,
  unitItemDetails,
  unitItemDetailsLoading = false,
  cashOptions,
  submitting = false,
  disabled = false,
  onCancel,
  onSubmit,
}: Props) {
  return (
    <UnitTransactionRefundForm
      type="purchase"
      transaction={purchase}
      totalPaid={totalPaid}
      unitItemDetails={unitItemDetails}
      unitItemDetailsLoading={unitItemDetailsLoading}
      cashOptions={cashOptions}
      submitting={submitting}
      disabled={disabled}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />
  );
}