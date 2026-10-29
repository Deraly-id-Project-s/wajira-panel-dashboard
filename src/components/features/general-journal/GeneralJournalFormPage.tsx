import { useEffect, useMemo } from 'react';
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
import {
  useCreateGeneralJournal,
  useGeneralJournalDetail,
  useUpdateGeneralJournal,
} from '@/hooks/useGeneralJournal';
import { useAccounts } from '@/hooks/useAccount';
import {
  generalJournalSchema,
  type GeneralJournalFormInput,
  type GeneralJournalFormValues,
} from '@/scheme/general-journal.schema';
import { fetchUserCompanies } from '@/services/company.service';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import GeneralJournalForm from './GeneralJournalForm';

interface Props {
  mode: 'create' | 'edit';
}

const emptyValues = (companyId: number): GeneralJournalFormInput => ({
  company_id: companyId,
  date: new Date(),
  note: '',
  payment_proof: null,
  is_usd_transaction: false,
  amount: 0,
  amount_original: 0,
  billings: [
    {
      account_id: 0,
      type: 'debet',
      amount: 0,
      amount_original: undefined,
      payment_at: undefined,
      note: '',
    },
    {
      account_id: 0,
      type: 'credit',
      amount: 0,
      amount_original: undefined,
      payment_at: undefined,
      note: '',
    },
  ],
});

export default function GeneralJournalFormPage({ mode }: Props) {
  const router = useRouter();
  const { slug, id: rawId } = router.query;
  const { companyId } = useCompany();
  const selectedCompanyId = Number(companyId || 0);
  const journalId = mode === 'edit' && typeof rawId === 'string' ? Number(rawId) : undefined;
  const basePath = typeof slug === 'string'
    ? `/dashboard/${slug}/finance/jurnal-umum`
    : '/dashboard';

  const form = useForm<GeneralJournalFormValues>({
    resolver: zodResolver(generalJournalSchema) as Resolver<GeneralJournalFormValues>,
    defaultValues: emptyValues(selectedCompanyId) as GeneralJournalFormValues,
  });

  const companyQuery = useQuery({
    queryKey: ['companies', 'selector'],
    queryFn: () => fetchUserCompanies(),
    staleTime: 10 * 60 * 1000,
  });

  const detailQuery = useGeneralJournalDetail(journalId, {
    enabled: mode === 'edit' && typeof journalId === 'number' && Number.isFinite(journalId),
    refetchInterval: false,
  });

  const accountQuery = useAccounts({
    page: 1,
    perPage: 1000,
    search: '',
    company_id: selectedCompanyId,
    enabled: Boolean(selectedCompanyId),
  });

  const accountOptions = useMemo(() => accountQuery.data?.data ?? [], [accountQuery.data?.data]);

  const createMutation = useCreateGeneralJournal();
  const updateMutation = useUpdateGeneralJournal();
  const journalDetail = detailQuery.data;
  const isBusy = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (mode === 'create' && selectedCompanyId > 0) {
      form.setValue('company_id', selectedCompanyId, { shouldValidate: true });
    }
  }, [form, mode, selectedCompanyId]);

  useEffect(() => {
    if (mode !== 'edit' || !journalDetail) return;

    const isUsd = Boolean(journalDetail.is_usd_transaction);

    const initialBillings = (journalDetail.billings && journalDetail.billings.length > 0)
      ? journalDetail.billings.map((b) => ({
          id: b.id,
          account_id: Number(b.account_id),
          type: (b.type === 'credit' ? 'credit' : 'debet') as 'debet' | 'credit',
          amount: Number(b.amount || 0),
          amount_original: b.amount_original !== undefined && b.amount_original !== null
            ? Number(b.amount_original)
            : (isUsd ? undefined : Number(b.amount || 0)),
          payment_at: b.payment_at || undefined,
          note: b.note ?? '',
        }))
      : [
          { account_id: 0, type: 'debet' as const, amount: 0, amount_original: isUsd ? 0 : undefined, note: '' },
          { account_id: 0, type: 'credit' as const, amount: 0, amount_original: isUsd ? 0 : undefined, note: '' },
        ];

    form.reset({
      company_id: journalDetail.company_id,
      date: journalDetail.date ? new Date(journalDetail.date) : new Date(),
      note: journalDetail.note ?? '',
      payment_proof: null,
      is_usd_transaction: isUsd,
      amount: journalDetail.amount !== null && journalDetail.amount !== undefined ? Number(journalDetail.amount) : undefined,
      amount_original: journalDetail.amount_original !== null && journalDetail.amount_original !== undefined ? Number(journalDetail.amount_original) : undefined,
      billings: initialBillings,
    });
  }, [journalDetail, form, mode]);

  const handleSubmit = async (values: GeneralJournalFormValues) => {
    const isUsd = Boolean(values.is_usd_transaction);
    const debetBillings = values.billings.filter((b) => b.type === 'debet');
    const computedAmount = debetBillings.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const computedAmountOriginal = isUsd
      ? debetBillings.reduce((acc, curr) => acc + Number(curr.amount_original || 0), 0)
      : computedAmount;

    const payload = {
      company_id: values.company_id,
      date: format(values.date, 'yyyy-MM-dd'),
      note: values.note,
      payment_proof: values.payment_proof,
      is_usd_transaction: isUsd,
      amount: values.amount !== undefined && values.amount !== null && values.amount > 0 ? values.amount : computedAmount,
      amount_original: isUsd
        ? (values.amount_original !== undefined && values.amount_original !== null && values.amount_original > 0 ? values.amount_original : computedAmountOriginal)
        : (values.amount !== undefined && values.amount !== null && values.amount > 0 ? values.amount : computedAmount),
      billings: values.billings.map((item) => ({
        id: item.id,
        account_id: item.account_id,
        type: item.type,
        amount: item.amount,
        amount_original: isUsd ? (item.amount_original ?? item.amount) : item.amount,
        payment_at: item.payment_at || format(values.date, 'yyyy-MM-dd'),
        note: item.note ?? null,
      })),
    };

    try {
      let targetId: number | string | undefined = journalId;
      if (mode === 'edit') {
        if (!journalId) return;
        const result = await updateMutation.mutateAsync({ id: journalId, payload });
        targetId = result?.id ?? journalId;
        toast.success('Jurnal umum berhasil diperbarui');
      } else {
        const result = await createMutation.mutateAsync(payload);
        targetId = result?.id;
        toast.success('Jurnal umum berhasil ditambahkan');
      }

      const companySlug = typeof slug === 'string' && slug.trim() ? slug : 'wajira-morindo';
      const detailPath = targetId
        ? `/dashboard/${companySlug}/finance/jurnal-umum/${targetId}`
        : `/dashboard/${companySlug}/finance/jurnal-umum`;

      await router.push(detailPath);
    } catch (error) {
      toast.error(getApiErrorMessage(error) || `Gagal ${mode === 'edit' ? 'memperbarui' : 'menambahkan'} jurnal umum`);
    }
  };

  if (mode === 'edit' && (detailQuery.isLoading || !router.isReady)) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" text="Memuat data jurnal umum..." />
      </DashboardLayout>
    );
  }

  if (mode === 'edit' && (detailQuery.isError || !journalDetail)) {
    const message = detailQuery.error instanceof Error ? detailQuery.error.message : 'Data jurnal umum tidak ditemukan';
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader title="Edit Jurnal Umum" subtitle={message} onBack={() => void router.push(basePath)} />
          <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-700">{message}</div>
        </div>
      </DashboardLayout>
    );
  }

  if (mode === 'edit' && journalDetail?.is_paid) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader
            title="Edit Jurnal Umum"
            subtitle="Jurnal sudah diposting dan terkunci dari perubahan"
            onBack={() => void router.push(basePath)}
          />
          <div className="rounded-md border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            Jurnal umum ini telah diposting (`is_paid: true`). Untuk mengubah entri, batalkan status posting (unpost) terlebih dahulu melalui halaman detail jurnal.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isEdit = mode === 'edit';

  return (
    <DashboardLayout>
      <Head>
        <title>{isEdit ? 'Edit' : 'Tambah'} Jurnal Umum - Wajira Dashboard</title>
      </Head>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Jurnal Umum', onClick: () => void router.push(basePath) },
            { label: isEdit ? 'Edit Jurnal' : 'Tambah Jurnal' },
          ]}
          title={isEdit ? 'Edit Jurnal Umum' : 'Tambah Jurnal Umum'}
          subtitle={
            isEdit
              ? `Perbarui entri jurnal memorial ${journalDetail?.code ?? ''}`
              : 'Pencatatan transaksi memorial debet dan kredit non-kas'
          }
          onBack={() => void router.push(basePath)}
        />

        <GeneralJournalForm
          form={form}
          onSubmit={handleSubmit}
          companies={companyQuery.data ?? []}
          accountOptions={accountOptions}
          isAccountsLoading={accountQuery.isLoading}
          isBusy={isBusy}
          onCancel={() => void router.push(basePath)}
          submitLabel={isEdit ? 'Perbarui Jurnal' : 'Simpan Jurnal'}
          existingPaymentProof={journalDetail?.payment_proof}
        />
      </div>
    </DashboardLayout>
  );
}
