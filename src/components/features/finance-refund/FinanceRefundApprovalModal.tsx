import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import type { FinanceRefundRecord, RefundTransactionType } from '@/@types/finance-refund.types';
import type { UnitTransactionRefund } from '@/@types/refund.type';
import { useApproveFinanceRefund } from '@/hooks/useFinanceRefund';
import { useKas } from '@/hooks/useKas';
import { useRefundList } from '@/hooks/useRefundAdministrasi';
import { financeApprovalRefundSchema, type FinanceApprovalRefundFormValues } from '@/schemas/refund.schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { refundStatusLabel } from '@/components/features/refund/refund.utils';
import { toast } from 'sonner';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { useRouter } from 'next/router';
import { useCompany } from '@/contexts/CompanyContext';

interface FinanceRefundApprovalModalProps {
  open: boolean;
  onClose: () => void;
  refund: FinanceRefundRecord;
  transactionType: RefundTransactionType;
}

const formatDate = (value: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID');
};

export default function FinanceRefundApprovalModal({ open, onClose, refund, transactionType }: FinanceRefundApprovalModalProps) {
  const router = useRouter();
  const { slug } = router.query;
  const slugStr = typeof slug === 'string' ? slug : '';

  const { companyId } = useCompany();
  const approveMutation = useApproveFinanceRefund(transactionType);
  const kasQuery = useKas(companyId ?? 1);
  const refundHistoryQuery = useRefundList({ page: 1, perPage: 100, search: refund.transactionCode });

  const relatedRefund = useMemo<UnitTransactionRefund | undefined>(() => {
    return (refundHistoryQuery.data?.data ?? []).find(
      (item) => item.unit_transaction_id === refund.transactionId || item.code === refund.refundCode,
    );
  }, [refund.refundCode, refund.transactionId, refundHistoryQuery.data?.data]);

  const payments = relatedRefund?.payments ?? refund.payments ?? [];
  const totalPaid = payments.reduce((total, item) => total + Number(item.amount), 0);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FinanceApprovalRefundFormValues>({
    resolver: zodResolver(financeApprovalRefundSchema),
    defaultValues: {
      status: refund.status,
      cash_id: refund.cashId,
    },
  });

  const selectedStatus = watch('status');

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset({
        status: refund.status,
        cash_id: refund.cashId,
      });
      onClose();
    }
  };

  const onSubmit = async (values: FinanceApprovalRefundFormValues) => {
    try {
      await approveMutation.mutateAsync({
        refundId: refund.id,
        payload: {
          status: values.status,
          cash_id: values.status === 'approve' ? values.cash_id : undefined,
        },
      });
      toast.success(`Refund ${refundStatusLabel[values.status]!.toLowerCase()} dengan sukses`);
      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal memperbarui approval refund');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-8xl overflow-hidden p-0 rounded-md border border-[#E4E4E7] bg-white">
        <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <DialogTitle className="text-[16px] font-semibold text-slate-900">Approval Refund Finance</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 space-y-6 max-h-[70vh]">
            <div className="grid gap-4 lg:grid-row">
              <div className="rounded-md border border-[#E4E4E7] bg-white p-5">
                <h3 className="text-sm font-semibold text-slate-900">Informasi Refund</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-6">
                    <dt className="text-slate-500">Kode Refund</dt>
                    <CopyBox text={refund.refundCode} />
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <dt className="text-slate-500">Kode Transaksi</dt>
                    <CopyBox text={refund.transactionCode} />
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <dt className="text-slate-500">Tanggal Refund</dt>
                    <dd className="font-medium text-slate-900">{formatDate(refund.refundDate)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <dt className="text-slate-500">Supplier</dt>
                    <ReferenceLink href={`/dashboard/${slugStr}/master/supplier?search=${refund.partnerName}`}>
                      {refund.partnerName}
                    </ReferenceLink>
                  </div>
                </dl>

                <div className="mt-5 rounded-md border border-[#E4E4E7] bg-slate-50 p-4">
                  <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">Catatan Refund</Label>
                  <Textarea value={refund.note || '-'} readOnly className="mt-2 min-h-24 resize-none bg-white rounded-md border-[#E4E4E7]" />
                </div>
              </div>

              <div className="rounded-md border border-[#E4E4E7] bg-white p-5">
                <h3 className="text-sm font-semibold text-slate-900">Form Setujui Refund</h3>

                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[14px] font-medium text-[#171717]">Status Approval</Label>
                    <Controller
                      control={control}
                      name="status"
                      render={({ field }) => (
                        <Select value={field.value ? String(field.value) : ''} onValueChange={field.onChange}>
                          <SelectTrigger className="rounded-md border-[#E4E4E7] px-4 text-[15px] placeholder:text-[#A1A1AA]">
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                          <SelectContent onPointerDownOutside={(e) => e.preventDefault()}>
                            <SelectItem value="waiting">Menunggu</SelectItem>
                            <SelectItem value="approve">Setujui</SelectItem>
                            <SelectItem value="reject">Tolak</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.status ? <p className="text-sm text-red-650">{errors.status.message}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[14px] font-medium text-[#171717]">Cash Account</Label>
                    <Controller
                      control={control}
                      name="cash_id"
                      render={({ field }) => (
                        <Select value={field.value ? String(field.value) : ''} onValueChange={field.onChange} disabled={selectedStatus === 'approve'}>
                          <SelectTrigger className="rounded-md border-[#E4E4E7] px-4 text-[15px] placeholder:text-[#A1A1AA]">
                            <SelectValue placeholder={selectedStatus === 'approve' ? 'Pilih cash account' : 'Cash account hanya diperlukan saat approve'} />
                          </SelectTrigger>
                          <SelectContent onPointerDownOutside={(e) => e.preventDefault()}>
                            {(kasQuery.data?.data ?? []).map((kas) => (
                              <SelectItem key={kas.id} value={String(kas.id)}>
                                {kas.cash_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.cash_id ? <p className="text-sm text-red-650">{errors.cash_id.message}</p> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex gap-3 px-6 py-4 border-t bg-gray-50 justify-end">
            <Button type="button" variant="outline" className="w-[120px] rounded-md border-[#D4D4D8] text-[15px] text-[#171717]" onClick={onClose} disabled={approveMutation.isPending}>
              Batal
            </Button>
            <Button type="submit" className="w-[160px] rounded-md bg-[#1F3B5B] text-[15px] font-medium text-white hover:bg-[#19314b]" disabled={approveMutation.isPending}>
              {approveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" /> : null}
              {approveMutation.isPending ? 'Menyimpan...' : 'Simpan Approval'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
