import React from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TarifForm } from '@/components/features/tarif/TarifForm';
import { useCreateTarif } from '@/hooks/useTarif';
import type { TarifPayload } from '@/@types/tarif.types';
import { toast } from 'sonner';

export default function CreateTarifPage() {
    const router = useRouter();
    const slug = router.query.slug as string;
    const createMutation = useCreateTarif();

    const handleSubmit = async (data: TarifPayload) => {
        try {
            await createMutation.mutateAsync(data);
            toast.success('Data tarif berhasil ditambahkan');
            router.push(`/dashboard/${slug}/master/tarif`);
        } catch (error: any) {
            toast.error(error.message || 'Gagal menyimpan data tarif');
        }
    };

    return (
        <DashboardLayout>
            <TarifForm
                title="Tambah Tarif"
                onSubmit={handleSubmit}
                isSubmitting={createMutation.isPending}
            />
        </DashboardLayout>
    );
}
