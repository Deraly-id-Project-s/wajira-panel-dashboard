import React from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { FinanceAssetEditForm } from '@/components/features/finance/asset/FinanceAssetEditForm';
import { useFinanceAssetDetail, useUpdateFinanceAsset } from '@/hooks/useFinanceAsset';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function FinanceAssetEditPage() {
    const router = useRouter();
    const { slug, id } = router.query;

    const { data: asset, isLoading, error } = useFinanceAssetDetail(id as string);
    const updateMutation = useUpdateFinanceAsset();

    const handleSave = async (data: any) => {
        try {
            await updateMutation.mutateAsync({
                id: id as string,
                data: {
                    ...data,
                    description: data.description || `Penyusutan data asset ${id}`
                }
            });
            toast.success('Data aset berhasil diperbarui');
            router.push(`/dashboard/${slug}/finance/asset`);
        } catch (error: any) {
            toast.error(error.message || 'Gagal memperbarui data aset');
        }
    };

    const handleCancel = () => {
        router.push(`/dashboard/${slug}/finance/asset`);
    };

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <p className="text-gray-500 font-medium">Gagal memuat data aset.</p>
                    <button onClick={handleCancel} className="text-[#1e3a5f] font-semibold hover:underline flex items-center gap-1">
                        <ChevronLeft className="h-4 w-4" /> Kembali
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Aset', onClick: handleCancel },
                        { label: 'Edit Aset' }
                    ]}
                    title="Edit Aset"
                    subtitle="Edit data aset inventaris"
                    onBack={handleCancel}
                />

                {isLoading || !asset ? (
                    <div className="space-y-6">
                        <Skeleton className="h-[400px] w-full rounded-md" />
                        <div className="flex justify-center gap-4">
                            <Skeleton className="h-10 w-32 rounded-md" />
                            <Skeleton className="h-10 w-32 rounded-md" />
                        </div>
                    </div>
                ) : (
                    <FinanceAssetEditForm
                        initialData={asset}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        isSaving={updateMutation.isPending}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
