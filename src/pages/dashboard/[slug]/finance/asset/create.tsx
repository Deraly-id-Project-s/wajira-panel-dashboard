import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { FinanceAssetCreateForm } from '@/components/features/finance/asset/FinanceAssetCreateForm';
import { useCreateFinanceAsset } from '@/hooks/useFinanceAsset';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import type { FinanceAssetPayload } from '@/types/finance-asset.types';

export default function FinanceAssetCreatePage() {
    const router = useRouter();
    const { slug } = router.query;
    const { companyId } = useCompany();
    const createMutation = useCreateFinanceAsset();

    const handleSave = async (data: FinanceAssetPayload) => {
        try {
            await createMutation.mutateAsync({
                ...data,
                // Include company_id if needed, though usually finance assets might belong to company implicitly or explicitly
            });
            toast.success('Data aset finance berhasil ditambahkan');
            router.push(`/dashboard/${slug}/finance/asset`);
        } catch (error: any) {
            toast.error(error.message || 'Gagal menyimpan data');
        }
    };

    const handleCancel = () => {
        router.push(`/dashboard/${slug}/finance/asset`);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Aset', onClick: handleCancel },
                        { label: 'Tambah Aset' }
                    ]}
                    title="Tambah Aset Finance"
                    subtitle="Masukkan detail aset finance baru"
                    onBack={handleCancel}
                />

                <div>
                    <FinanceAssetCreateForm
                        onSave={handleSave}
                        onCancel={handleCancel}
                        isSaving={createMutation.isPending}
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}
