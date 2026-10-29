'use client';

import { useRouter } from 'next/router';
import { UnitTransactionPaymentPageView } from '@/components/features/unit-transaksi/UnitTransactionPaymentPageView';

export default function SalesPaymentPage() {
  const router = useRouter();
  const { id } = router.query;
  const salesId = Array.isArray(id) ? id[0] : id;

  if (!salesId) return null;

  return (
    <UnitTransactionPaymentPageView
      type="sales"
      transactionId={String(salesId)}
    />
  );
}
