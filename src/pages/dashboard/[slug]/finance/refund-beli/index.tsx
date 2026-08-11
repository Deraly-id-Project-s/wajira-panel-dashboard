import { FinanceRefundPage } from '@/components/features/finance-refund/FinanceRefundPage';

export default function RefundBeliPage() {
  return (
    <FinanceRefundPage
      title="Data Refund Pembelian"
      description="Kelola arus transaksi refund pembelian"
      transactionType="purchase"
    />
  );
}
