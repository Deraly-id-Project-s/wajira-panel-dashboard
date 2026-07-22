import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { financeRefundService } from '@/services/finance-refund.service';
import { useKas } from '@/hooks/useKas';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Approval Refund Finance</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
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

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleReject}
              disabled={approveMutation.isPending}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              Reject
            </Button>
            <Button
              type="button"
              onClick={handleApprove}
              disabled={approveMutation.isPending || !selectedKas}
              className="bg-[#1f304f] hover:bg-[#1a2842] text-white"
            >
              {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Approve
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
