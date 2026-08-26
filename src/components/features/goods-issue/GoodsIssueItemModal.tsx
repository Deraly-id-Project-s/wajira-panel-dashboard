'use client';

import { GoodsTransactionItemModal } from '../goods-receipt/GoodsTransactionItemModal';
import type { GoodsIssueItem } from '@/types/goods-issue.types';
import type { Material } from '@/types/material.types';
import type { GoodsIssueItemFormValues } from '@/schemas/goods-issue.schema';

interface GoodsIssueItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GoodsIssueItemFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  initialData?: GoodsIssueItem | null;
  materials: Material[];
  isLoadingMaterials?: boolean;
  materialSearch?: string;
  onMaterialSearchChange?: (value: string) => void;
}

export function GoodsIssueItemModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  materials,
  isLoadingMaterials = false,
  materialSearch = '',
  onMaterialSearchChange,
}: GoodsIssueItemModalProps) {
  return (
    <GoodsTransactionItemModal
      type="issue"
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
