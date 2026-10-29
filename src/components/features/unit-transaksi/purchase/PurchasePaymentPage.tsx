'use client';

import { useRouter } from 'next/router';
import { UnitTransactionPaymentPageView } from '@/components/features/unit-transaksi/UnitTransactionPaymentPageView';

export default function PurchasePaymentPage() {
  const router = useRouter();
  const { id } = router.query;
  const purchaseId = Array.isArray(id) ? id[0] : id;

  if (!purchaseId) return null;

  return (
    <UnitTransactionPaymentPageView
      type="purchase"
      transactionId={String(purchaseId)}
    />
  );
}
