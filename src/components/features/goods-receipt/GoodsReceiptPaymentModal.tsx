'use client';

import { GoodsTransactionPaymentModal } from './GoodsTransactionPaymentModal';
import type { GoodsReceipt } from '@/types/goods-receipt.types';
import type { Kas } from '@/types/kas.types';
import type { GoodsReceiptPaymentFormValues } from '@/schemas/goods-receipt.schema';

interface GoodsReceiptPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GoodsReceiptPaymentFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  transaction: GoodsReceipt;
  totalAmount: number;
  cashes: Kas[];
  isLoadingCashes?: boolean;
}

export function GoodsReceiptPaymentModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  transaction,
  totalAmount,
  cashes,
  isLoadingCashes = false,
}: GoodsReceiptPaymentModalProps) {
  return (
    <GoodsTransactionPaymentModal
      type="receipt"
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
