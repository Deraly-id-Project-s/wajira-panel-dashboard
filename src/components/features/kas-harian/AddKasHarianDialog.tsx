import { useEffect } from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { FormDialog } from '@/components/ui/form-dialog';
import { useCompany } from '@/contexts/CompanyContext';
import { fetchUserCompanies } from '@/services/company.service';
import { useCreateKasHarian } from '@/hooks/useKasHarian';
import { kasHarianSchema, type KasHarianFormInput, type KasHarianFormValues } from '@/scheme/kas-harian.schema';
import KasHarianForm from './KasHarianForm';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddKasHarianDialog({ open, onOpenChange }: Props) {
  const { companyId } = useCompany();
  const selectedCompanyId = Number(companyId || 0);
  const { mutateAsync: createKasHarian, isPending } = useCreateKasHarian();
  const form = useForm<KasHarianFormInput, unknown, KasHarianFormValues>({
    resolver: zodResolver(kasHarianSchema) as Resolver<KasHarianFormInput, unknown, KasHarianFormValues>,
    defaultValues: {
      company_id: selectedCompanyId || 0,
      date: new Date(),
      note: '',
      debet: 0,
      debet_usd: 0,
      credit: 0,
      credit_usd: 0,
      payment_proof: null,
    },
  });

  const companyQuery = useQuery({
    queryKey: ['companies', 'selector'],
    queryFn: () => fetchUserCompanies(),
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (open) {
      form.reset({
        company_id: selectedCompanyId || 0,
        date: new Date(),
        note: '',
        debet: 0,
        debet_usd: 0,
        credit: 0,
        credit_usd: 0,
        payment_proof: null,
      });
    }
  }, [form, open, selectedCompanyId]);

  const onSubmit = async (data: KasHarianFormValues) => {
    try {
      await createKasHarian({
        company_id: data.company_id,
        date: format(data.date, 'yyyy-MM-dd'),
        note: data.note,
        debet: data.debet,
        debet_usd: data.debet_usd,
        credit: data.credit,
        credit_usd: data.credit_usd,
        payment_proof: data.payment_proof,
      });

      toast.success('Transaksi kas harian berhasil ditambahkan');
      onOpenChange(false);
      form.reset();
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Gagal menambahkan transaksi kas harian';
      toast.error(message);
      onOpenChange(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Tambah Transaksi KAS"
      description="Masukkan detail transaksi baru"
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        void form.handleSubmit(onSubmit)();
      }}
      maxWidthClassName="max-w-2xl"
      isSubmitting={isPending}
    >
      <KasHarianForm
        form={form}
        onSubmit={onSubmit}
        companies={companyQuery.data ?? []}
        wrapWithForm={false}
      />
    </FormDialog>
  );
}
