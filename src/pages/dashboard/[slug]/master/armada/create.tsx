import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { ArmadaForm } from '@/components/features/armada/ArmadaForm';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { useCreateArmada } from '@/hooks/useArmada';
import type { ArmadaPayload } from '@/types/armada.types';
import { getApiErrorMessage } from '@/lib/utils/apiErrorHandler';

export default function CreateArmadaPage() {
  const router = useRouter();
  const { slug } = router.query;
  const createMutation = useCreateArmada();
  const back = () => {
    if (slug) {
      router.push(`/dashboard/${slug}/master/armada`);
    } else {
      router.back();
    }
  };

  const handleSave = async (payload: ArmadaPayload) => {
    try {
      await createMutation.mutateAsync(payload);
      toast.success('Data armada berhasil ditambahkan');
      if (slug) {
        router.push(`/dashboard/${slug}/master/armada`);
      }
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Detail Armada"
          subtitle="Tambah armada baru"
          breadcrumbs={[
            { label: 'Armada', onClick: back },
            { label: 'Tambah Armada' },
          ]}
          onBack={back}
        />

        <ArmadaForm title="Tambah Armada" onSubmit={handleSave} isSubmitting={createMutation.isPending} />
      </div>
    </DashboardLayout>
  );
}
