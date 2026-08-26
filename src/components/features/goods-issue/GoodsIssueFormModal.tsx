'use client';

import { GoodsTransactionFormModal } from '../goods-receipt/GoodsTransactionFormModal';
import type { Customer } from '@/types/customer.types';
import type { GoodsIssue } from '@/types/goods-issue.types';
import type { GoodsIssueFormValues } from '@/schemas/goods-issue.schema';

interface GoodsIssueFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GoodsIssueFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  initialData?: GoodsIssue | null;
  customers: Customer[];
  isLoadingCustomers?: boolean;
  customerSearch?: string;
  onCustomerSearchChange?: (value: string) => void;
}

export function GoodsIssueFormModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  customers,
  isLoadingCustomers = false,
  customerSearch = '',
  onCustomerSearchChange,
}: GoodsIssueFormModalProps) {
  return (
    <GoodsTransactionFormModal
      type="issue"
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      initialData={initialData}
      partners={customers}
      isLoadingPartners={isLoadingCustomers}
      partnerSearch={customerSearch}
      onPartnerSearchChange={onCustomerSearchChange}
    />
  );
}
