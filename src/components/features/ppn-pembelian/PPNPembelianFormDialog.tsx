'use client';

import { useUpdatePPNPembelian } from '@/hooks/usePPN';
import { PPNFormDialog } from './PPNFormDialog';
import type { PPNPembelian } from '@/types/ppn.types';

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: PPNPembelian | null;
}

export default function PPNPembelianFormDialog({ open, onClose, initialData }: Props) {
  const updateMutation = useUpdatePPNPembelian();

  return (
    <PPNFormDialog
      type="pembelian"
      open={open}
      onClose={onClose}
      initialData={initialData}
      onUpdate={updateMutation.mutateAsync}
      isSubmitting={updateMutation.isPending}
    />
  );
}
