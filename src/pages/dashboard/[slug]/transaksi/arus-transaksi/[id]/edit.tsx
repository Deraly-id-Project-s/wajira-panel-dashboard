'use client';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import TransactionForm from '@/components/features/transaction/TransactionForm';
import { useUpdateTransaction } from '@/hooks/useTransaction';
import { getTransactionById } from '@/services/transaction.service';
import { Transaction } from '@/@types/transaction.types';
import { useCompany } from '@/contexts/CompanyContext';
import { TransactionFormValues } from '@/scheme/transaction.schema';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';

export default function EditTransactionPage() {
  const router = useRouter();
  const { id, slug } = router.query;
  const { companyId } = useCompany();
  const safeCompanyId = companyId || '1';
  const basePath = slug ? `/dashboard/${slug}/transaksi/arus-transaksi` : '/transaksi/arus-transaksi';

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  const updateMutation = useUpdateTransaction(safeCompanyId);

  // Fetch Data Manually or via Query
  // Since we're in 'pages' dir, standard way is useEffect or getServerSideProps.
  // We stick to client fetch compatible with previous patterns.
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const data = await getTransactionById(id as string);
        if (!data) {
          toast.error('Transaksi tidak ditemukan');
          router.push(basePath);
          return;
        }
        setTransaction(data);
      } catch {
        toast.error('Gagal mendapatkan data');
      } finally {
        setIsFetching(false);
      }
    };

    load();
  }, [id, router, basePath]);

  const handleSubmit = async (values: TransactionFormValues) => {
    if (!id) return;

    try {
      await updateMutation.mutateAsync({
        id: id as string,
        payload: {
          companyId: safeCompanyId,
          unitTransactionId: values.unitTransactionId ?? null,
          date: values.date,
          name: values.name,
          description: values.description ?? '',
          debitUSD: values.debitUSD ?? 0,
          creditUSD: values.creditUSD ?? 0,
          debitIDR: values.debitIDR ?? 0,
          creditIDR: values.creditIDR ?? 0,
          debitCash: values.debitCash ?? 0,
          creditCash: values.creditCash ?? 0,
          transactionProof: values.transactionProof ?? null,
        },
      });
      toast.success('Transaksi berhasil diperbarui');
      router.push(basePath);
    } catch {
      toast.error('Gagal memperbarui transaksi');
    }
  };

  if (isFetching) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (!transaction) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Arus Transaksi', onClick: () => router.push(basePath) },
            { label: 'Edit Transaksi' }
          ]}
          title="Edit Transaksi"
          subtitle="Ubah detail transaksi yang sudah ada"
          onBack={() => router.push(basePath)}
        />

        <div className="rounded-md border bg-white p-6 md:p-8">
          <TransactionForm
            defaultValues={{
              ...transaction,
            }}
            onSubmit={handleSubmit}
            onCancel={() => router.push(basePath)}
            isBusy={updateMutation.isPending}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
