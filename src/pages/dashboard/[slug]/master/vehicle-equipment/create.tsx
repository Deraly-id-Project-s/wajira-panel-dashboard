import React from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { VehicleEquipmentForm } from '@/components/features/vehicle-equipment/VehicleEquipmentForm';
import { useCreateVehicleEquipment } from '@/hooks/useVehicleEquipment';
import type { VehicleEquipmentFormValues } from '@/scheme/vehicle-equipment.schema';
import { toast } from 'sonner';

export default function CreateVehicleEquipmentPage() {
  const router = useRouter();
  const slug = router.query.slug as string;
  const createMutation = useCreateVehicleEquipment();

  const handleSubmit = async (data: VehicleEquipmentFormValues) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Data perlengkapan berhasil ditambahkan');
      router.push(`/dashboard/${slug}/master/vehicle-equipment`);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyimpan data perlengkapan');
    }
  };

  return (
    <DashboardLayout>
      <VehicleEquipmentForm
        title="Tambah Perlengkapan Kendaraan"
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </DashboardLayout>
  );
}
