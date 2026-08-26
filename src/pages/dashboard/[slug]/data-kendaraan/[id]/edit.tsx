import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ArmadaForm } from '@/components/features/armada/ArmadaForm';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { ChevronLeft } from 'lucide-react';
import { useArmadaDetail, useUpdateArmada } from '@/hooks/useArmada';
import type { ArmadaPayload } from '@/types/armada.types';
import { useCompany } from '@/contexts/CompanyContext';
import { VehicleDataForm } from '@/components/features/vehicle-data/VehicleDataForm';
import { useVehicleDataDetail, useUpdateVehicleData } from '@/hooks/useVehicleData';
import type { VehicleDataPayload } from '@/types/vehicle-data.types';

export default function EditVehicleFleetPage() {
  const router = useRouter();
  const { slug, id } = router.query;
  const { companyId } = useCompany();

  // Standard Armada Hooks
  const { data: initialData, isLoading: isArmadaLoading, isError: isArmadaError } = useArmadaDetail(companyId !== '3' && id ? String(id) : null);
  const updateMutation = useUpdateArmada();

  // Vehicle Data Hooks
  const { data: vehicleInitialData, isLoading: isVehicleLoading, isError: isVehicleError } = useVehicleDataDetail(companyId === '3' && id ? String(id) : null);
  const updateVehicleMutation = useUpdateVehicleData();

  const handleSave = async (payload: ArmadaPayload) => {
    if (!id) return;

    try {
      await updateMutation.mutateAsync({ id: String(id), payload });
      toast.success('Data kendaraan berhasil diubah');
      if (slug) {
        router.push(`/dashboard/${slug}/data-kendaraan`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data kendaraan');
    }
  };

  const handleSaveVehicle = async (payload: VehicleDataPayload) => {
    if (!id) return;

    try {
      await updateVehicleMutation.mutateAsync({ id: String(id), data: payload });
      toast.success('Data kendaraan berhasil diubah');
      if (slug) {
        router.push(`/dashboard/${slug}/data-kendaraan`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data kendaraan');
    }
  };

  const isLoading = companyId === '3' ? isVehicleLoading : isArmadaLoading;
  const isError = companyId === '3' ? isVehicleError : isArmadaError;
  const hasData = companyId === '3' ? !!vehicleInitialData : !!initialData;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500">Memuat data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !hasData) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <p className="text-red-500">Gagal memuat data kendaraan</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {companyId === '3' ? (
        <VehicleDataForm
          title="Edit Kendaraan"
          initialData={vehicleInitialData}
          onSubmit={handleSaveVehicle}
          isSubmitting={updateVehicleMutation.isPending}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <button onClick={() => router.back()} className="rounded-md p-1 transition-colors hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Detail Kendaraan</h1>
              <p className="text-sm text-gray-500">
                Nomor Polisi <span className="font-medium text-[#1e3a5f]">{initialData?.registrationNumber}</span>
              </p>
            </div>
          </div>

          <ArmadaForm title="Edit Kendaraan" initialData={initialData} onSubmit={handleSave} isSubmitting={updateMutation.isPending} />
        </div>
      )}
    </DashboardLayout>
  );
}
