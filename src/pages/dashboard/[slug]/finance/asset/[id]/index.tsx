import React from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { FinanceAssetDetailForm } from '@/components/features/finance/asset/FinanceAssetDetailForm';
import { useFinanceAssetDetail } from '@/hooks/useFinanceAsset';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function FinanceAssetDetailPage() {
    const router = useRouter();
    const { slug, id } = router.query;

    const { data: asset, isLoading, error } = useFinanceAssetDetail(id as string);

    const handleBack = () => {
        router.push(`/dashboard/${slug}/finance/asset`);
    };

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <p className="text-gray-500 font-medium">Gagal memuat detail data aset.</p>
                    <button onClick={handleBack} className="text-[#1e3a5f] font-semibold hover:underline flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Aset', onClick: handleBack },
                        { label: 'Detail Aset' }
                    ]}
                    title="Detail Aset"
                    subtitle="Detail data aset inventaris"
                    onBack={handleBack}
                />

                {isLoading || !asset ? (
                    <div className="space-y-6">
                        <Skeleton className="h-[400px] w-full rounded-md" />
                        <div className="flex justify-center">
                            <Skeleton className="h-10 w-32 rounded-md" />
                        </div>
                    </div>
                ) : (
                    <FinanceAssetDetailForm
                        asset={asset}
                        onBack={handleBack}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
