import * as React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { VehicleRegistrationForm } from '@/components/features/vehicle-document/VehicleRegistrationForm';
import { useUpdateVehicleRegistration, useVehicleDocumentDetail } from '@/hooks/useVehicleDocument';
import type { VehicleRegistrationPayload } from '@/types/vehicle-document.types';
import { LoadingState } from '@/components/ui/loading-state';

export default function EditVehicleRegistrationPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const documentId = typeof router.query.id === 'string' ? router.query.id : null;
  const registrationId = typeof router.query.registrationId === 'string' ? Number(router.query.registrationId) : null;

  const detailQuery = useVehicleDocumentDetail(documentId);
  const updateMutation = useUpdateVehicleRegistration();

  const registration = React.useMemo(() => {
    if (!registrationId || !detailQuery.data) return null;
    const registrations = detailQuery.data.vehicleRegistrations || [];
    return registrations.find((item) => Number(item.id) === Number(registrationId)) ?? null;
  }, [detailQuery.data, registrationId]);

  const handleSubmit = async ({ registrationPayload }: { registrationPayload: VehicleRegistrationPayload }) => {
    if (!registrationId || !documentId) return;

    try {
      if (typeof window !== 'undefined') {
        console.groupEnd();
      }

      await updateMutation.mutateAsync({ id: registrationId, payload: registrationPayload });

      toast.success('Detail STNK/BPKB berhasil diperbarui');
      router.push(`/dashboard/${slug}/stnk-bpkb/${documentId}/edit`);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui detail STNK/BPKB');
    }
  };

  return (
    <DashboardLayout>
      {detailQuery.isLoading ? (
        <LoadingState variant="page" />
      ) : detailQuery.isError || !registration ? (
        <div className="flex h-[360px] flex-col items-center justify-center gap-3 text-center">
          <p className="text-red-500">Detail registrasi tidak ditemukan.</p>
          <button onClick={() => router.back()} className="text-sm text-blue-600 underline">Kembali</button>
        </div>
      ) : (
        <VehicleRegistrationForm
          initialData={registration}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
        />
      )}
    </DashboardLayout>
  );
}
