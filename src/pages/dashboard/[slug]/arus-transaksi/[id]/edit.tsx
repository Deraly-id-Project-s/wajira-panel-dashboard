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
import { ChevronRight } from 'lucide-react';

import { TransactionFormValues } from '@/scheme/transaction.schema';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';

export default function EditTransactionPage() {
    const router = useRouter();
    const { id, slug } = router.query;
    const { companyId } = useCompany();
    const safeCompanyId = companyId || '1';
    const basePath = slug ? `/dashboard/${slug}/arus-transaksi` : '/arus-transaksi';

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
                    date: values.date,
                    name: values.name,
                    description: values.description ?? values.name,
                    debitUSD: values.debitUSD ?? 0,
                    creditUSD: values.creditUSD ?? 0,
                    debitIDR: values.debitIDR ?? 0,
                    creditIDR: values.creditIDR ?? 0,
                    debitCash: values.debitCash ?? 0,
                    creditCash: values.creditCash ?? 0,
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
                        { label: 'Arus Transaksi', onClick: () => router.push(`/dashboard/${slug}/arus-transaksi`) },
                        { label: 'Edit Data Arus Transaksi' }
                    ]}
                    title="Edit Transaksi"
                    subtitle="Perbarui isi dan tampilan template dokumen"
                    onBack={() => router.push(`/dashboard/${slug}/arus-transaksi`)}
                />

                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Edit Transaksi</h1>
                    <p className="text-sm text-muted-foreground">Ubah detail transaksi yang sudah ada</p>
                </div>

                <div className="rounded-md border bg-white p-6 md:p-8">
                    <TransactionForm
                        defaultValues={{
                            ...transaction,
                            // Ensure date format needs
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
