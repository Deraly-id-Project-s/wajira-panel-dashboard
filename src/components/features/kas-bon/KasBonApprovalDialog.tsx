import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type {
  DriverCashAdvance,
  DriverCashAdvanceApprovalPayload,
} from '@/@types/driver-cash-advance.types';
import { Button } from '@/components/ui/button';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { LoadingState } from '@/components/ui/loading-state';
import { MoneyInput } from '@/components/ui/money-input';
import RequiredMark from '@/components/ui/required-mark';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatKasBonDate } from './kas-bon.utils';

const approvalSchema = z.object({
  is_approve: z.enum(['true', 'false'], {
    required_error: 'Status approval wajib dipilih.',
  }),
  approve_date: z.string().min(1, 'Tanggal approval wajib diisi.'),
  approve_nominal: z.number().min(0, 'Nominal tidak boleh negatif.'),
});

type ApprovalFormValues = z.infer<typeof approvalSchema>;

interface KasBonApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: DriverCashAdvance | null;
  onConfirm: (payload: DriverCashAdvanceApprovalPayload) => Promise<void> | void;
  isApproving?: boolean;
}

export function KasBonApprovalDialog({
  open,
  onOpenChange,
  item,
  onConfirm,
  isApproving = false,
}: KasBonApprovalDialogProps) {
  const form = useForm<ApprovalFormValues>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      is_approve: 'true',
      approve_date: format(new Date(), 'yyyy-MM-dd'),
      approve_nominal: 0,
    },
  });

  React.useEffect(() => {
    if (open && item) {
      form.reset({
        is_approve: 'true',
        approve_date: format(new Date(), 'yyyy-MM-dd'),
        approve_nominal: Number(item.approveNominal || item.claimNominal || 0),
      });
    }
  }, [open, item, form]);

  const selectedIsApprove = form.watch('is_approve');

  const handleSubmit = async (values: ApprovalFormValues) => {
    const isApprove = values.is_approve === 'true';
    await onConfirm({
      is_approve: isApprove,
      approve_date: values.approve_date,
      approve_nominal: isApprove ? Math.round(values.approve_nominal) : 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-xl p-0 overflow-hidden"
        showCloseButton={!isApproving}
      >
        <DialogHeader className="p-6 pb-3">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            Approval Kas Bon
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {item?.code ? <span className="font-semibold text-slate-700">{item.code}</span> : null}
            {item?.code && item?.subject ? ' — ' : null}
            {item?.subject ? <span>{item.subject}</span> : null}
          </DialogDescription>
        </DialogHeader>

        {item && (
          <div className="mx-6 mb-2 rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Driver:</span>
              <span className="font-medium text-slate-800">{item.driver?.name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tanggal Pengajuan:</span>
              <span className="font-medium text-slate-800">{formatKasBonDate(item.claimDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Nominal Pengajuan:</span>
              <span className="font-semibold text-slate-900">
                {currenciesFormat('idr', item.claimNominal)}
              </span>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 px-6 pb-6">
            <FormField
              control={form.control}
              name="is_approve"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>
                    Status Approval <RequiredMark />
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isApproving}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih status approval" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">
                        <div className="flex items-center gap-2 text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Setujui</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="false">
                        <div className="flex items-center gap-2 text-rose-700">
                          <XCircle className="h-4 w-4" />
                          <span>Tolak</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="approve_date"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>
                    Tanggal Approval <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <InputDate
                      {...field}
                      disabled={isApproving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedIsApprove === 'true' && (
              <FormField
                control={form.control}
                name="approve_nominal"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>
                      Nominal Disetujui <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <MoneyInput
                        value={field.value}
                        onChangeValue={field.onChange}
                        disabled={isApproving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isApproving}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="btn-primary!"
                disabled={isApproving}
              >
                {isApproving ? (
                  <LoadingState
                    variant="inline"
                    text="Menyimpan..."
                    iconClassName="text-white"
                  />
                ) : (
                  'Simpan Approval'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
