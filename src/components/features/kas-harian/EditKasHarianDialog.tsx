import { useEffect } from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { FormDialog } from '@/components/ui/form-dialog';
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
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Transaksi KAS"
      description="Perbarui detail transaksi kas harian"
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        void form.handleSubmit(onSubmit)();
      }}
      maxWidthClassName="max-w-[520px]"
      isSubmitting={isPending}
    >
      <KasHarianForm
        form={form}
        onSubmit={onSubmit}
        companies={companyQuery.data ?? []}
        lockAmounts={lockAmounts}
        wrapWithForm={false}
      />
    </FormDialog>
  );
}
