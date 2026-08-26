'use client';

import {
  GoodsTransactionFormModal,
  type GoodsTransactionFormModalProps,
} from './GoodsTransactionFormModal';
import type { GoodsReceipt } from '@/types/goods-receipt.types';
import type { Supplier } from '@/types/supplier.types';
import type { GoodsReceiptFormValues } from '@/schemas/goods-receipt.schema';

interface GoodsReceiptFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GoodsReceiptFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  initialData?: GoodsReceipt | null;
  suppliers: Supplier[];
  isLoadingSuppliers?: boolean;
  supplierSearch?: string;
  onSupplierSearchChange?: (value: string) => void;
}

export function GoodsReceiptFormModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  suppliers,
  isLoadingSuppliers = false,
  supplierSearch = '',
  onSupplierSearchChange,
}: GoodsReceiptFormModalProps) {
  return (
    <GoodsTransactionFormModal
      type="receipt"
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      initialData={initialData}
      partners={suppliers}
      isLoadingPartners={isLoadingSuppliers}
      partnerSearch={supplierSearch}
      onPartnerSearchChange={onSupplierSearchChange}
    />
  );
}
