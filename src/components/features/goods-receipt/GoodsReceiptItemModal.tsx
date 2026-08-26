'use client';

import { GoodsTransactionItemModal } from './GoodsTransactionItemModal';
import type { GoodsReceiptItem } from '@/types/goods-receipt.types';
import type { Material } from '@/types/material.types';
import type { GoodsReceiptItemFormValues } from '@/schemas/goods-receipt.schema';

interface GoodsReceiptItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GoodsReceiptItemFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  initialData?: GoodsReceiptItem | null;
  materials: Material[];
  isLoadingMaterials?: boolean;
  materialSearch?: string;
  onMaterialSearchChange?: (value: string) => void;
}

export function GoodsReceiptItemModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  materials,
  isLoadingMaterials = false,
  materialSearch = '',
  onMaterialSearchChange,
}: GoodsReceiptItemModalProps) {
  return (
    <GoodsTransactionItemModal
      type="receipt"
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      initialData={initialData}
      materials={materials}
      isLoadingMaterials={isLoadingMaterials}
      materialSearch={materialSearch}
      onMaterialSearchChange={onMaterialSearchChange}
    />
  );
}
