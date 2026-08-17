import { useEffect } from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { fetchUserCompanies } from '@/services/company.service';
import { useUpdateKasHarian } from '@/hooks/useKasHarian';
import { kasHarianSchema, type KasHarianFormInput, type KasHarianFormValues } from '@/scheme/kas-harian.schema';
import type { KasHarian } from '@/@types/kas-harian.types';
import KasHarianForm from './KasHarianForm';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: KasHarian | null;
}

export default function EditKasHarianDialog({ open, onOpenChange, data }: Props) {
  const { mutateAsync: updateKasHarian, isPending } = useUpdateKasHarian();
  const lockAmounts = (data?.finance_billings ?? []).length > 0;
  const form = useForm<KasHarianFormInput, unknown, KasHarianFormValues>({
    resolver: zodResolver(kasHarianSchema) as Resolver<KasHarianFormInput, unknown, KasHarianFormValues>,
    defaultValues: {
      company_id: 0,
      date: new Date(),
      note: '',
      debet: 0,
      credit: 0,
      transaction_category: 'general',
      payment_proof: null,
    },
  });

  const companyQuery = useQuery({
    queryKey: ['companies', 'selector'],
    queryFn: () => fetchUserCompanies(),
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (data && open) {
      form.reset({
        company_id: data.company_id,
        date: data.date ? new Date(data.date) : new Date(),
        note: data.note,
        debet: data.debet,
        credit: data.credit,
        transaction_category: data.transaction_category || 'general',
        payment_proof: null,
      });
    }
  }, [data, open, form]);

  const onSubmit = async (values: KasHarianFormValues) => {
    if (!data) return;

    try {
      await updateKasHarian({
        id: data.id,
        payload: {
          company_id: values.company_id,
          date: format(values.date, 'yyyy-MM-dd'),
          note: values.note,
          debet: values.debet,
          credit: values.credit,
          transaction_category: values.transaction_category,
          payment_proof: values.payment_proof,
        },
      });

      toast.success('Transaksi kas harian berhasil diperbarui');
      onOpenChange(false);
      form.reset();
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Gagal memperbarui transaksi kas harian';
      toast.error(message);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-[520px] overflow-hidden rounded-[28px] border-0 p-0 shadow-2xl">
        <div className="flex max-h-[92vh] flex-col rounded-[28px] border border-slate-200 bg-white">
          <DialogHeader className="space-y-1 px-6 pt-6 text-left sm:px-8 sm:pt-8">
            <DialogTitle className="text-xl font-semibold text-slate-955">Edit Transaksi KAS</DialogTitle>
            <p className="text-sm text-muted-foreground">Perbarui detail transaksi kas harian</p>
          </DialogHeader>

          <div className="mt-6 flex-1 overflow-y-auto px-6 pb-6 sm:px-8">
            <KasHarianForm
              form={form}
              onSubmit={onSubmit}
              id="edit-kas-form"
              companies={companyQuery.data ?? []}
              lockAmounts={lockAmounts}
            />
          </div>

          <div className="border-t border-slate-100 px-6 py-5 sm:px-8">
            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="outline" className="border-slate-200" onClick={() => onOpenChange(false)} disabled={isPending}>
                Batal
              </Button>
              <Button type="submit" className="bg-[#1e3a5f] hover:bg-[#152e4d]" form="edit-kas-form" disabled={isPending}>
                {isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
