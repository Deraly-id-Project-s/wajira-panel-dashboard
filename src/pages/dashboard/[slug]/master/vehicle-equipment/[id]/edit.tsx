import React from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { VehicleEquipmentForm } from '@/components/features/vehicle-equipment/VehicleEquipmentForm';
import { useVehicleEquipmentDetail, useUpdateVehicleEquipment } from '@/hooks/useVehicleEquipment';
import type { VehicleEquipmentFormValues } from '@/scheme/vehicle-equipment.schema';
import { toast } from 'sonner';

export default function EditVehicleEquipmentPage() {
  const router = useRouter();
  const slug = router.query.slug as string;
  const id = router.query.id as string;

  const { data: equipmentData, isLoading, isError } = useVehicleEquipmentDetail(id);
  const updateMutation = useUpdateVehicleEquipment();

  const handleSubmit = async (data: VehicleEquipmentFormValues) => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({ id, data });
      toast.success('Data perlengkapan berhasil diubah');
      router.push(`/dashboard/${slug}/master/vehicle-equipment`);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyimpan data perlengkapan');
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
          <p className="text-red-500">Gagal memuat data perlengkapan</p>
          <button onClick={() => router.back()} className="text-blue-500 underline">
            Kembali
          </button>
        </div>
      ) : equipmentData ? (
        <VehicleEquipmentForm
          initialData={equipmentData}
          title="Edit Perlengkapan Kendaraan"
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
        />
      ) : null}
    </DashboardLayout>
  );
}
