import React from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TarifForm } from '@/components/features/tarif/TarifForm';
import { useTarifDetail, useUpdateTarif } from '@/hooks/useTarif';
import type { TarifPayload } from '@/types/tarif.types';
import { toast } from 'sonner';

export default function EditTarifPage() {
    const router = useRouter();
    const slug = router.query.slug as string;
    const id = router.query.id as string;

    const { data: tarifData, isLoading, isError } = useTarifDetail(id);
    const updateMutation = useUpdateTarif();

    const handleSubmit = async (data: TarifPayload) => {
        if (!id) return;
        try {
            await updateMutation.mutateAsync({ id, data });
            toast.success('Data tarif berhasil diubah');
            router.push(`/dashboard/${slug}/master/tarif`);
        } catch (error: any) {
            toast.error(error.message || 'Gagal menyimpan data tarif');
        }
    };

    return (
        <DashboardLayout>
            {isLoading ? (
                <div className="flex h-[400px] items-center justify-center">
                    <p className="text-gray-500">Memuat data...</p>
                </div>
            ) : isError ? (
                <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
                    <p className="text-red-500">Gagal memuat data tarif</p>
                    <button onClick={() => router.back()} className="text-blue-500 underline">
                        Kembali
                    </button>
                </div>
            ) : tarifData ? (
                <TarifForm
                    initialData={tarifData}
                    title="Edit Tarif"
                    onSubmit={handleSubmit}
                    isSubmitting={updateMutation.isPending}
                />
            ) : null}
        </DashboardLayout>
    );
}
