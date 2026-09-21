import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { type Resolver, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { useCompany } from '@/contexts/CompanyContext';
import { useCreateKasHarian, useKasHarianDetail, useUpdateKasHarian } from '@/hooks/useKasHarian';
import { kasHarianSchema, type KasHarianFormInput, type KasHarianFormValues } from '@/scheme/kas-harian.schema';
import { fetchUserCompanies } from '@/services/company.service';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import KasHarianForm from './KasHarianForm';

interface Props {
  mode: 'create' | 'edit';
}

const emptyValues = (companyId: number): KasHarianFormInput => ({
  company_id: companyId,
  date: new Date(),
  note: '',
  debet: 0,
  debet_usd: 0,
  credit: 0,
  credit_usd: 0,
  payment_proof: null,
});

export default function KasHarianFormPage({ mode }: Props) {
  const router = useRouter();
  const { slug, id: rawId } = router.query;
  const { companyId } = useCompany();
  const selectedCompanyId = Number(companyId || 0);
  const cashFlowId = mode === 'edit' && typeof rawId === 'string' ? Number(rawId) : undefined;
  const basePath = typeof slug === 'string'
    ? `/dashboard/${slug}/finance/transaksi-kas-harian`
    : '/dashboard';

  const form = useForm<KasHarianFormInput, unknown, KasHarianFormValues>({
    resolver: zodResolver(kasHarianSchema) as Resolver<KasHarianFormInput, unknown, KasHarianFormValues>,
    defaultValues: emptyValues(selectedCompanyId),
  });

  const companyQuery = useQuery({
    queryKey: ['companies', 'selector'],
    queryFn: () => fetchUserCompanies(),
    staleTime: 10 * 60 * 1000,
  });
  const detailQuery = useKasHarianDetail(cashFlowId, {
    enabled: mode === 'edit' && typeof cashFlowId === 'number' && Number.isFinite(cashFlowId),
    refetchInterval: false,
  });
  const createMutation = useCreateKasHarian();
  const updateMutation = useUpdateKasHarian();
  const cashFlow = detailQuery.data;
  const isBusy = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (mode === 'create' && selectedCompanyId > 0) {
      form.setValue('company_id', selectedCompanyId, { shouldValidate: true });
    }
  }, [form, mode, selectedCompanyId]);

  useEffect(() => {
    if (mode !== 'edit' || !cashFlow) return;
    form.reset({
      company_id: cashFlow.company_id,
      date: cashFlow.date ? new Date(cashFlow.date) : new Date(),
      note: cashFlow.note ?? '',
      debet: Number(cashFlow.debet ?? 0),
      debet_usd: Number(cashFlow.debet_usd ?? 0),
      credit: Number(cashFlow.credit ?? 0),
      credit_usd: Number(cashFlow.credit_usd ?? 0),
      payment_proof: null,
    });
  }, [cashFlow, form, mode]);

  const handleSubmit = async (values: KasHarianFormValues) => {
    const payload = {
      company_id: values.company_id,
      date: format(values.date, 'yyyy-MM-dd'),
      note: values.note,
      debet: values.debet,
      debet_usd: values.debet_usd,
      credit: values.credit,
      credit_usd: values.credit_usd,
      payment_proof: values.payment_proof,
    };

    try {
      let targetId: number | string | undefined = cashFlowId;
      if (mode === 'edit') {
        if (!cashFlowId) return;
        const result = await updateMutation.mutateAsync({ id: cashFlowId, payload });
        targetId = result?.id ?? cashFlowId;
        toast.success('Transaksi kas harian berhasil diperbarui');
      } else {
        const result = await createMutation.mutateAsync(payload);
        targetId = result?.id;
        toast.success('Transaksi kas harian berhasil ditambahkan');
      }

      const detailPath = typeof slug === 'string' && targetId
        ? `/dashboard/${slug}/finance/transaksi-kas-harian/${targetId}`
        : basePath;

      await router.push(detailPath);
    } catch (error) {
      toast.error(getApiErrorMessage(error) || `Gagal ${mode === 'edit' ? 'memperbarui' : 'menambahkan'} transaksi kas harian`);
    }
  };

  if (mode === 'edit' && (detailQuery.isLoading || !router.isReady)) {
    return <DashboardLayout><LoadingState variant="page" text="Memuat transaksi kas harian..." /></DashboardLayout>;
  }

  if (mode === 'edit' && (detailQuery.isError || !cashFlow)) {
    const message = detailQuery.error instanceof Error ? detailQuery.error.message : 'Data transaksi kas harian tidak ditemukan';
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader title="Edit Transaksi Kas Harian" subtitle={message} onBack={() => void router.push(basePath)} />
          <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-700">{message}</div>
        </div>
      </DashboardLayout>
    );
  }

  const isEdit = mode === 'edit';

  return (
    <DashboardLayout>
      <Head><title>{isEdit ? 'Edit' : 'Tambah'} Transaksi Kas Harian - Wajira Dashboard</title></Head>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Transaksi Kas Harian', onClick: () => void router.push(basePath) },
            { label: isEdit ? 'Edit Transaksi' : 'Tambah Transaksi' },
          ]}
          title={isEdit ? 'Edit Transaksi Kas Harian' : 'Tambah Transaksi Kas Harian'}
          subtitle={isEdit ? 'Perbarui detail transaksi kas yang sudah ada' : 'Masukkan detail transaksi kas baru'}
          onBack={() => void router.push(basePath)}
        />

        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <KasHarianForm
            form={form}
            onSubmit={handleSubmit}
            companies={companyQuery.data ?? []}
            isBusy={isBusy}
            existingPaymentProof={cashFlow?.payment_proof}
            submitLabel={isEdit ? 'Simpan Perubahan' : 'Simpan Transaksi'}
            onCancel={() => void router.push(basePath)}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
