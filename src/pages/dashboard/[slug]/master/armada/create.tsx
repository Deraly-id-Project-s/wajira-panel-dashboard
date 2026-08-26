import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ArmadaForm } from '@/components/features/armada/ArmadaForm';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { ChevronLeft } from 'lucide-react';
import { useCreateArmada } from '@/hooks/useArmada';
import type { ArmadaPayload } from '@/types/armada.types';

import { getApiErrorMessage } from '@/lib/utils/apiErrorHandler';

export default function CreateArmadaPage() {
  const router = useRouter();
  const { slug } = router.query;
  const createMutation = useCreateArmada();

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
        <div className="flex items-center space-x-2">
          <button onClick={() => router.back()} className="rounded-md p-1 transition-colors hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Detail Armada</h1>
            <p className="text-sm text-gray-500">Tambah armada baru</p>
          </div>
        </div>

        <ArmadaForm title="Tambah Armada" onSubmit={handleSave} isSubmitting={createMutation.isPending} />
      </div>
    </DashboardLayout>
  );
}
