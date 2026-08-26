import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import type { Transaction } from '@/types/transaction.types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { useCompany } from '@/contexts/CompanyContext';
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/useTransaction';
import type { TransactionFormValues } from '@/schemas/transaction.schema';
import { getTransactionById } from '@/services/transaction.service';
import { getApiErrorMessage } from '@/lib/utils/apiErrorHandler';
import TransactionForm from './TransactionForm';

interface Props {
  mode: 'create' | 'edit';
}

export default function TransactionFormPage({ mode }: Props) {
  const router = useRouter();
  const { slug, id: rawId } = router.query;
  const { companyId } = useCompany();
  const safeCompanyId = companyId || '1';
  const basePath = typeof slug === 'string' ? `/dashboard/${slug}/arus-transaksi` : '/arus-transaksi';
  const transactionId = mode === 'edit' && typeof rawId === 'string' ? rawId : undefined;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isFetching, setIsFetching] = useState(mode === 'edit');

  const createMutation = useCreateTransaction(safeCompanyId);
  const updateMutation = useUpdateTransaction(safeCompanyId);
  const isBusy = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (mode !== 'edit' || !transactionId) return;
    let isActive = true;

    const loadTransaction = async () => {
      setIsFetching(true);
      try {
        const data = await getTransactionById(transactionId);
        if (isActive) setTransaction(data);
      } catch (error) {
        if (isActive) toast.error(getApiErrorMessage(error) || 'Gagal mendapatkan data transaksi');
      } finally {
        if (isActive) setIsFetching(false);
      }
    };

    void loadTransaction();
    return () => { isActive = false; };
  }, [mode, transactionId]);

  const handleSubmit = async (values: TransactionFormValues) => {
    const description = values.description?.trim() || values.name.trim();
    const payload = {
      companyId: safeCompanyId,
      date: values.date,
      name: values.name.trim(),
      description,
      debitUSD: values.debitUSD ?? 0,
      creditUSD: values.creditUSD ?? 0,
      debitIDR: values.debitIDR ?? 0,
      creditIDR: values.creditIDR ?? 0,
      debitCash: values.debitCash ?? 0,
      creditCash: values.creditCash ?? 0,
    };

    try {
      if (mode === 'edit') {
        if (!transactionId) return;
        await updateMutation.mutateAsync({ id: transactionId, payload });
        toast.success('Transaksi berhasil diperbarui');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Transaksi berhasil ditambahkan');
      }
      await router.push(basePath);
    } catch (error) {
      toast.error(getApiErrorMessage(error) || `Gagal ${mode === 'edit' ? 'memperbarui' : 'menambahkan'} transaksi`);
    }
  };

  if (mode === 'edit' && (isFetching || !router.isReady)) {
    return <DashboardLayout><LoadingState variant="page" text="Memuat transaksi..." /></DashboardLayout>;
  }

  if (mode === 'edit' && !transaction) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader title="Edit Arus Transaksi" subtitle="Data transaksi tidak dapat ditampilkan" onBack={() => void router.push(basePath)} />
          <Card className="rounded-md border-red-200 bg-red-50 shadow-none"><CardContent className="p-6 text-sm text-red-700">Data transaksi tidak ditemukan.</CardContent></Card>
        </div>
      </DashboardLayout>
    );
  }

  const isEdit = mode === 'edit';

  return (
    <DashboardLayout>
      <Head><title>{isEdit ? 'Edit' : 'Tambah'} Arus Transaksi - Wajira Dashboard</title></Head>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Arus Transaksi', onClick: () => void router.push(basePath) },
            { label: isEdit ? 'Edit Transaksi' : 'Tambah Transaksi' },
          ]}
          title={isEdit ? 'Edit Arus Transaksi' : 'Tambah Arus Transaksi'}
          subtitle={isEdit ? 'Perbarui detail transaksi operasional yang sudah ada' : 'Masukkan detail transaksi operasional baru'}
          onBack={() => void router.push(basePath)}
        />

        <Card className="rounded-md border-slate-200 shadow-sm">
          <CardContent className="p-6 md:p-8">
            <TransactionForm
              defaultValues={isEdit && transaction ? {
                date: transaction.date,
                name: transaction.name,
                debitUSD: transaction.debitUSD,
                creditUSD: transaction.creditUSD,
                debitIDR: transaction.debitIDR,
                creditIDR: transaction.creditIDR,
                debitCash: transaction.debitCash,
                creditCash: transaction.creditCash,
                description: transaction.description ?? '',
              } : undefined}
              onSubmit={handleSubmit}
              onCancel={() => void router.push(basePath)}
              isBusy={isBusy}
              submitLabel={isEdit ? 'Simpan Perubahan' : 'Simpan Transaksi'}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
