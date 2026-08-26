import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ArmadaForm } from '@/components/features/armada/ArmadaForm';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { ChevronLeft } from 'lucide-react';
import { useArmadaDetail, useUpdateArmada } from '@/hooks/useArmada';
import type { ArmadaPayload } from '@/types/armada.types';

import { getApiErrorMessage } from '@/lib/utils/apiErrorHandler';
import { PageHeader } from '@/components/ui/page-header';

export default function EditArmadaPage() {
  const router = useRouter();
  const { slug, id } = router.query;
  const { data: initialData, isLoading, isError } = useArmadaDetail(id ? String(id) : null);
  const updateMutation = useUpdateArmada();

  const handleSave = async (payload: ArmadaPayload) => {
    if (!id) return;

    try {
      await updateMutation.mutateAsync({ id: String(id), payload });
      toast.success('Data armada berhasil diubah');
      if (slug) {
        router.push(`/dashboard/${slug}/master/armada`);
      }
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500">Memuat data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !initialData) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <p className="text-red-500">Gagal memuat data armada</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Armada' },
            { label: 'Data Armada' }
          ]}
          title="Edit Armada"
          subtitle={
            <>
              <span>No Polisi:</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">{initialData.registrationNumber}</span>
            </>
          }
          onBack={() => router.push(`/dashboard/${slug}/master/armada`)}
        />

        <ArmadaForm title="Edit Armada" initialData={initialData} onSubmit={handleSave} isSubmitting={updateMutation.isPending} />
      </div>
    </DashboardLayout>
  );
}
