'use client';

import { GoodsTransactionPaymentModal } from '../goods-receipt/GoodsTransactionPaymentModal';
import type { GoodsIssue } from '@/types/goods-issue.types';
import type { Kas } from '@/types/kas.types';
import type { GoodsIssuePaymentFormValues } from '@/schemas/goods-issue.schema';

interface GoodsIssuePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GoodsIssuePaymentFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  transaction: GoodsIssue;
  totalAmount: number;
  cashes: Kas[];
  isLoadingCashes?: boolean;
}

export function GoodsIssuePaymentModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  transaction,
  totalAmount,
  cashes,
  isLoadingCashes = false,
}: GoodsIssuePaymentModalProps) {
  return (
    <GoodsTransactionPaymentModal
      type="issue"
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      transaction={transaction}
      totalAmount={totalAmount}
      cashes={cashes}
      isLoadingCashes={isLoadingCashes}
    />
  );
}
