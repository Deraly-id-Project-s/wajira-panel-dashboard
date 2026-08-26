import * as React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils/apiErrorHandler';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BBNBillVehicleFeeForm } from '@/components/features/tagihan-bbn/BBNBillVehicleFeeForm';
import { useBBNBillDetail, useUpdateBBNBillVehicleData } from '@/hooks/useBBNBill';
import { LoadingState } from '@/components/ui/loading-state';

export default function EditBBNBillVehiclePage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const id = typeof router.query.id === 'string' ? router.query.id : null;
  const vehicleDataId = typeof router.query.vehicleDataId === 'string' ? Number(router.query.vehicleDataId) : null;

  const detailQuery = useBBNBillDetail(id);
  const updateMutation = useUpdateBBNBillVehicleData();

  const vehicle = React.useMemo(() => {
    if (!vehicleDataId) return null;
    return detailQuery.data?.dealerDetail?.vehicleDatas.find((item) => item.id === vehicleDataId) ?? null;
  }, [detailQuery.data?.dealerDetail?.vehicleDatas, vehicleDataId]);

  return (
    <DashboardLayout>
      {detailQuery.isLoading ? (
        <LoadingState variant="page" />
      ) : detailQuery.isError || !vehicle ? (
        <div className="flex h-[360px] flex-col items-center justify-center gap-3 text-center">
          <p className="text-red-500">Detail kendaraan tidak ditemukan.</p>
          <button onClick={() => router.back()} className="text-sm text-blue-600 underline">Kembali</button>
        </div>
      ) : (
        <BBNBillVehicleFeeForm
          vehicle={vehicle}
          isSubmitting={updateMutation.isPending}
          onCancel={() => router.push(`/dashboard/${slug}/tagihan-bbn/${id}`)}
          onSubmit={async (payload) => {
            if (!vehicle) return;
            const vehicleRegistrationId = vehicle.vehicleRegistration?.id;
            if (!vehicleRegistrationId) {
              toast.error('ID Registrasi Kendaraan tidak ditemukan');
              return;
            }

            try {
              await updateMutation.mutateAsync({ vehicleRegistrationId, payload });
              toast.success('Data detail STNK/BPKB berhasil diperbarui');
              router.push(`/dashboard/${slug}/tagihan-bbn/${id}`);
            } catch (error: any) {
              toast.error(getApiErrorMessage(error));
            }
          }}
        />
      )}
    </DashboardLayout>
  );
}
