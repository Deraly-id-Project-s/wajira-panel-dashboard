import { BillingPaymentForm, type BillingPaymentFormProps } from '@/components/features/unit-transaksi/billing/BillingPaymentForm';
import { BillingCostSummary } from '@/components/features/unit-transaksi/billing/BillingCostSummary';
import { BillingHistoryTable } from '@/components/features/unit-transaksi/billing/BillingHistoryTable';
import type { PaymentFormData } from '@/hooks/useUnitTransactionBillingPayment';
import type { UnitBilling, UnitBillingHistory } from '@/@types/unit-billing.types';

export type { PaymentFormData };

export interface UnitTransactionPaymentFormProps {
  type: 'purchase' | 'sales';
  code: string;
  totalTagihan: number;
  totalPpn: number;
  totalDpp?: number;
  totalTagihanUsd?: number;
  totalTagihanUsdActual?: number;
  isUsdTransaction?: boolean;
  billing: UnitBilling | null;
  histories: UnitBillingHistory[];
  onSubmitPayment: (data: PaymentFormData) => Promise<void>;
  onDeleteHistory?: (id: string | number) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  canSubmit?: boolean;
  validationMessage?: string;
}

export function UnitTransactionPaymentForm({
  type,
  totalTagihan,
  totalPpn,
  totalDpp = 0,
  totalTagihanUsd = 0,
  isUsdTransaction = false,
  billing,
  histories,
  onSubmitPayment,
  onDeleteHistory,
  onCancel,
  loading = false,
  canSubmit = true,
  validationMessage,
}: UnitTransactionPaymentFormProps) {
  const isPaid = Boolean(billing?.is_paid);
  const remainingUsd = isPaid ? 0 : Number(billing?.remaining_payment_usd ?? billing?.remaining_payment ?? totalTagihanUsd);
  const remainingIdr = isPaid ? 0 : Number(billing?.remaining_payment ?? totalTagihan);

  return (
    <div className="space-y-6">
      <BillingCostSummary
        type={type}
        isUsd={Boolean(isUsdTransaction)}
        isPaid={isPaid}
        totalTagihanUsd={totalTagihanUsd}
        totalPaidUsd={Number(billing?.total_usd_payment ?? billing?.total_paid ?? 0)}
        remainingPaymentUsd={remainingUsd}
        totalTagihanIdr={totalTagihan}
        totalPaidIdr={Number(billing?.total_paid ?? 0)}
        remainingPaymentIdr={remainingIdr}
        totalDpp={totalDpp}
        totalPpn={totalPpn}
      />

      <BillingPaymentForm
        isUsd={Boolean(isUsdTransaction)}
        isPaid={isPaid}
        remainingPaymentUsd={remainingUsd}
        remainingPaymentIdr={remainingIdr}
        loading={loading}
        canSubmit={canSubmit && !isPaid}
        onSubmit={onSubmitPayment}
        onCancel={onCancel}
        validationMessage={validationMessage}
      />

      <BillingHistoryTable
        isUsd={Boolean(isUsdTransaction)}
        isPaid={isPaid}
        histories={histories}
        loading={loading}
        onDeleteHistory={onDeleteHistory}
      />
    </div>
  );
}

export default UnitTransactionPaymentForm;
