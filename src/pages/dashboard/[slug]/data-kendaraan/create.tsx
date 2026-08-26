import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ArmadaForm } from '@/components/features/armada/ArmadaForm';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { ChevronLeft } from 'lucide-react';
import { useCreateArmada } from '@/hooks/useArmada';
import type { ArmadaPayload } from '@/types/armada.types';
import { useCompany } from '@/contexts/CompanyContext';
import { VehicleDataForm } from '@/components/features/vehicle-data/VehicleDataForm';
import { useCreateVehicleData } from '@/hooks/useVehicleData';
import type { VehicleDataPayload } from '@/types/vehicle-data.types';

export default function CreateVehicleFleetPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { companyId } = useCompany();
  const createMutation = useCreateArmada();
  const createVehicleMutation = useCreateVehicleData();

  const handleSave = async (payload: ArmadaPayload) => {
    try {
      await createMutation.mutateAsync(payload);
      toast.success('Data kendaraan berhasil ditambahkan');
      if (slug) {
        router.push(`/dashboard/${slug}/data-kendaraan`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data kendaraan');
    }
  };

  const handleSaveVehicle = async (payload: VehicleDataPayload) => {
    try {
      await createVehicleMutation.mutateAsync(payload);
      toast.success('Data kendaraan berhasil ditambahkan');
      if (slug) {
        router.push(`/dashboard/${slug}/data-kendaraan`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data kendaraan');
    }
  };

  return (
    <DashboardLayout>
      {companyId === '3' ? (
        <VehicleDataForm title="Tambah Kendaraan" onSubmit={handleSaveVehicle} isSubmitting={createVehicleMutation.isPending} />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <button onClick={() => router.back()} className="rounded-md p-1 transition-colors hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Detail Kendaraan</h1>
              <p className="text-sm text-gray-500">Tambah kendaraan baru</p>
            </div>
          </div>

          <ArmadaForm title="Tambah Kendaraan" onSubmit={handleSave} isSubmitting={createMutation.isPending} />
        </div>
      )}
    </DashboardLayout>
  );
}
