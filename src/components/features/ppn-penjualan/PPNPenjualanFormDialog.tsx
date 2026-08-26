'use client';

import { useUpdatePPNPenjualan } from '@/hooks/usePPN';
import { PPNFormDialog } from '../ppn-pembelian/PPNFormDialog';
import type { PPNPenjualan } from '@/types/ppn.types';

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: PPNPenjualan | null;
}

export default function PPNPenjualanFormDialog({ open, onClose, initialData }: Props) {
  const updateMutation = useUpdatePPNPenjualan();

  return (
    <PPNFormDialog
      type="penjualan"
      open={open}
      onClose={onClose}
      initialData={initialData}
      onUpdate={updateMutation.mutateAsync}
      isSubmitting={updateMutation.isPending}
    />
  );
}
