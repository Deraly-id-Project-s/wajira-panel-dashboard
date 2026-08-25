'use client';
// Force HMR update

import { useRouter } from 'next/router';

import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import TransactionForm from '@/components/features/transaction/TransactionForm';
import { useCreateTransaction } from '@/hooks/useTransaction';
import { useCompany } from '@/contexts/CompanyContext';
import { ChevronRight } from 'lucide-react';

import { TransactionFormValues } from '@/scheme/transaction.schema';
import { PageHeader } from '@/components/ui/page-header';

export default function CreateTransactionPage() {
    const router = useRouter();
    const { slug } = router.query;
    const { companyId } = useCompany();
    const safeCompanyId = companyId || '1';
    const basePath = slug ? `/dashboard/${slug}/arus-transaksi` : '/arus-transaksi';

    const createMutation = useCreateTransaction(safeCompanyId);

    const handleSubmit = async (data: TransactionFormValues) => {
        try {
            await createMutation.mutateAsync({
                companyId: safeCompanyId,
                date: data.date,
                name: data.name,
                description: data.description ?? data.name,
                debitUSD: data.debitUSD ?? 0,
                creditUSD: data.creditUSD ?? 0,
                debitIDR: data.debitIDR ?? 0,
                creditIDR: data.creditIDR ?? 0,
                debitCash: data.debitCash ?? 0,
                creditCash: data.creditCash ?? 0,
            });

            toast.success('Transaksi berhasil ditambahkan');
            router.push(basePath);
        } catch {
            toast.error('Gagal menambahkan transaksi');
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Arus Transaksi', onClick: () => router.push(`/dashboard/${slug}/arus-transaksi`) },
                        { label: 'Tambah Data Arus Transaksi' }
                    ]}
                    title="Tambah Transaksi"
                    subtitle="Perbarui isi dan tampilan template dokumen"
                    onBack={() => router.push(`/dashboard/${slug}/arus-transaksi`)}
                />

                <div className="rounded-md border bg-white p-6 md:p-8">
                    <TransactionForm
                        defaultValues={{
                            date: new Date().toISOString().split('T')[0],
                            name: '',
                            debitUSD: undefined,
                            creditUSD: undefined,
                            debitIDR: undefined,
                            creditIDR: undefined,
                            debitCash: undefined,
                            creditCash: undefined,
                            description: '',
                        }}
                        onSubmit={handleSubmit}
                        onCancel={() => router.push(basePath)}
                        isBusy={createMutation.isPending}
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}
