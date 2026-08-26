import { useState } from 'react';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { financeRefundService } from '@/services/finance-refund.service';
import { useKas } from '@/hooks/useKas';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

interface FinanceRefundApprovalModalProps {
  open: boolean;
  onClose: () => void;
  refundId: number;
  onSuccess?: () => void;
}

export default function FinanceRefundApprovalModal({ open, onClose, refundId, onSuccess }: FinanceRefundApprovalModalProps) {
  const { companyId } = useCompany();
  const { data: kasList, isLoading: isLoadingKas } = useKas(companyId ?? undefined);
  const [selectedKas, setSelectedKas] = useState<string>('');

  const approveMutation = useMutation({
    mutationFn: (data: { status: 'approve' | 'reject'; cash_id?: string }) =>
      financeRefundService.approveRefund(String(refundId), data),
    onSuccess: () => {
      // Callback to parent to refetch data since some hooks use custom state instead of react-query
      if (onSuccess) onSuccess();
      toast.success('Status refund berhasil diperbarui');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Gagal memperbarui status refund');
    }
  });

  const handleApprove = () => {
    if (!selectedKas) {
      toast.error('Pilih akun kas terlebih dahulu');
      return;
    }
    approveMutation.mutate({ status: 'approve', cash_id: selectedKas });
  };

  const handleReject = () => {
    approveMutation.mutate({ status: 'reject' });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onClose}
      title="Approval Refund Finance"
      onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleApprove(); }}
      onCancel={handleReject}
      submitLabel="Approve"
      cancelLabel="Reject"
      maxWidthClassName="max-w-[425px]"
      isSubmitting={approveMutation.isPending}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Pilih Cash Account (Kas) <span className="text-red-500">*</span></Label>
          <Select value={selectedKas} onValueChange={setSelectedKas} disabled={isLoadingKas}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={isLoadingKas ? "Memuat..." : "Pilih Kas"} />
            </SelectTrigger>
            <SelectContent>
              {kasList?.data?.map((kas) => (
                <SelectItem key={kas.id} value={String(kas.id)}>
                  {kas.description || kas.code || `Kas ${kas.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </FormDialog>
  );
}
