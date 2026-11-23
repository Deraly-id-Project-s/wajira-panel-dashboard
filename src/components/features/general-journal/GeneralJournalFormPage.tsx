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
import {
  generalJournalSchema,
  type GeneralJournalFormInput,
  type GeneralJournalFormValues,
} from '@/scheme/general-journal.schema';
import { fetchUserCompanies } from '@/services/company.service';
import {
  createGeneralJournalBillingPayment,
  fetchGeneralJournalDetail,
  toggleGeneralJournalPaidStatus,
  updateGeneralJournalBillingPayment,
} from '@/services/generalJournal.service';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import GeneralJournalForm from './GeneralJournalForm';
import type { GeneralJournalPayload } from '@/@types/general-journal.types';

interface Props {
  mode: 'create' | 'edit';
}

const emptyValues = (companyId: number): GeneralJournalFormInput => ({
  company_id: companyId,
  date: new Date(),
  type: 'debit',
  note: '',
  payment_proof: null,
  is_usd_transaction: false,
  is_paid: false,
  amount: 0,
  amount_original: 0,
  billings: [],
  payments: [
    {
      account_id: 0,
      debit: 0,
      credit: 0,
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

    const firstBilling = journalDetail.billings?.[0];
    const rawType = String(
      firstBilling?.cashes?.[0]?.type ||
      (journalDetail as any)?.type ||
      (Number(journalDetail.total_credit || 0) > 0 && Number(journalDetail.total_debit || 0) === 0 ? 'credit' : '') ||
      ''
    ).toLowerCase();
    const existingType: 'credit' | 'debit' = rawType === 'credit' || rawType === 'kredit' ? 'credit' : 'debit';

    const initialPayments = (firstBilling?.payments && firstBilling.payments.length > 0)
      ? firstBilling.payments.map((p) => {
          const amt = Number(p.amount || 0);
          const isDeb = p.type === 'debit';
          return {
            id: p.id,
            account_id: Number(p.account_id),
            debit: isDeb ? amt : 0,
            credit: !isDeb ? amt : 0,
            type: (p.type === 'credit' ? 'credit' : 'debit') as 'debit' | 'credit',
            amount: amt,
            amount_original: Number(p.amount_original || 0),
            note: p.note ?? '',
          };
        })
      : [{ account_id: 0, debit: 0, credit: 0, note: '' }];

    form.reset({
      company_id: journalDetail.company_id,
      date: journalDetail.date ? new Date(journalDetail.date) : new Date(),
      type: existingType,
      note: journalDetail.note ?? '',
      payment_proof: null,
      is_usd_transaction: false,
      is_paid: Boolean(journalDetail.is_paid),
      amount: journalDetail.amount !== null && journalDetail.amount !== undefined ? Number(journalDetail.amount) : undefined,
      amount_original: journalDetail.amount_original !== null && journalDetail.amount_original !== undefined ? Number(journalDetail.amount_original) : undefined,
      billings: firstBilling
        ? [
            {
              id: firstBilling.id,
              date: firstBilling.date ? new Date(firstBilling.date) : new Date(journalDetail.date),
              note: firstBilling.note ?? '',
              cashes: [],
            },
          ]
        : [],
      payments: initialPayments,
    });
  }, [journalDetail, form, mode]);

  const handleSubmit = async (values: GeneralJournalFormValues) => {
    const grandAmount = Number(values.amount || 0);
    const primaryType: 'debit' | 'credit' =
      String(values.type).toLowerCase() === 'credit' || String(values.type).toLowerCase() === 'kredit'
        ? 'credit'
        : 'debit';

    // Format payments untuk Single Form Format 5
    const paymentsPayload = (values.payments || [])
      .filter((p) => Number(p.account_id) > 0 && (Number(p.debit || 0) > 0 || Number(p.credit || 0) > 0))
      .map((p) => {
        const isDeb = Number(p.debit || 0) > 0;
        const amt = isDeb ? Number(p.debit) : Number(p.credit);
        return {
          id: p.id,
          account_id: Number(p.account_id),
          type: (isDeb ? 'debit' : 'credit') as 'debit' | 'credit',
          amount: amt,
          amount_original: amt,
          note: p.note || null,
        };
      });

    const payload: GeneralJournalPayload = {
      company_id: values.company_id,
      date: format(values.date, 'yyyy-MM-dd'),
      type: primaryType,
      note: values.note,
      payment_proof: values.payment_proof,
      is_usd_transaction: false,
      is_paid: Boolean(values.is_paid),
      amount: grandAmount,
      amount_original: grandAmount,
      payments: paymentsPayload,
    };

    try {
      let targetId: number | string | undefined = journalId;
      let targetBillingId: number | undefined;

      if (mode === 'edit') {
        if (!journalId) return;
        const result = await updateMutation.mutateAsync({ id: journalId, payload });
        targetId = result?.id ?? journalId;
        targetBillingId = result?.billings?.[0]?.id ?? journalDetail?.billings?.[0]?.id;
      } else {
        const result = await createMutation.mutateAsync(payload);
        targetId = result?.id;
        targetBillingId = result?.billings?.[0]?.id;
      }

      // Pastikan setiap rincian pembayaran tersimpan dan tersinkronisasi
      if (targetId && values.payments && values.payments.length > 0) {
        if (!targetBillingId) {
          try {
            const detail = await fetchGeneralJournalDetail(targetId);
            targetBillingId = detail.billings?.[0]?.id;
          } catch {
            // ignore
          }
        }

        if (targetBillingId) {
          for (const p of values.payments) {
            const isDeb = Number(p.debit || 0) > 0;
            const amt = isDeb ? Number(p.debit) : Number(p.credit);
            const pType = isDeb ? 'debit' : 'credit';

            if (Number(p.account_id) > 0 && amt > 0) {
              if (p.id) {
                await updateGeneralJournalBillingPayment(p.id, {
                  account_id: Number(p.account_id),
                  type: pType,
                  amount: amt,
                  note: p.note || null,
                });
              } else {
                await createGeneralJournalBillingPayment({
                  general_journal_billing_id: targetBillingId,
                  account_id: Number(p.account_id),
                  type: pType,
                  amount: amt,
                  amount_original: amt,
                  note: p.note || null,
                });
              }
            }
          }
        }
      }

      // Jika user memilih "Tandai Lunas"
      if (targetId && values.is_paid) {
        try {
          await toggleGeneralJournalPaidStatus({ id: targetId, isPaid: true });
        } catch {
          // Abaikan jika sudah ditandai true oleh backend saat pembuatan/pembaruan
        }
      }

      toast.success(
        values.is_paid
          ? `Jurnal umum berhasil ${mode === 'edit' ? 'diperbarui' : 'disimpan'} dan ditandai lunas`
          : `Jurnal umum berhasil ${mode === 'edit' ? 'diperbarui' : 'disimpan'}`
      );

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
              ? `Update data transaksi jurnal umum ${journalDetail?.code ?? ''}`
              : 'Pencatatan data transaksi jurnal umum baru'
          }
          onBack={() => void router.push(basePath)}
        />

        <GeneralJournalForm
          form={form}
          onSubmit={handleSubmit}
          companies={companyQuery.data ?? []}
          isBusy={isBusy}
          onCancel={() => void router.push(basePath)}
          submitLabel={isEdit ? 'Perbarui Jurnal' : 'Simpan Jurnal'}
          existingPaymentProof={journalDetail?.payment_proof}
        />
      </div>
    </DashboardLayout>
  );
}
