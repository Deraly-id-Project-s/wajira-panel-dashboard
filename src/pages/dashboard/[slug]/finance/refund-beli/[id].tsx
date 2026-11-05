import { useRouter } from 'next/router';
import FinanceRefundDetailPageView from '@/components/features/finance-refund/FinanceRefundDetailPageView';

export default function FinanceRefundBeliDetailPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';

  return <FinanceRefundDetailPageView id={id} transactionType="purchase" />;
}
