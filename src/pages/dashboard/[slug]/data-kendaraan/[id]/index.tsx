import React from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useArmadaDetail } from '@/hooks/useArmada';
import { Skeleton } from '@/components/ui/skeleton';
import { ARMADA_EQUIPMENT_FIELDS } from '@/@types/armada.types';
import type { ArmadaEquipmentField } from '@/@types/armada.types';
import { useCompany } from '@/contexts/CompanyContext';
import { VehicleDataDetail } from '@/components/features/vehicle-data/VehicleDataDetail';
import { useVehicleDataDetail } from '@/hooks/useVehicleData';

const equipmentLabels: Record<ArmadaEquipmentField, string> = {
  radio_tape: 'Radio Tape',
  jack: 'Dongkrak',
  spare_tire: 'Ban Serep',
  toolkit: 'Toolkit',
  jack_handle: 'Handle Dongkrak',
  pressure_pipe_1: 'Pipa Tekan 1',
  first_aid_kit: 'Kotak P3K',
  cigarette_lighter: 'Pemantik Rokok',
  pressure_pipe_2: 'Pipa Tekan 2',
  seat_saddle: 'Pelana Jok',
  handlebar_hose: 'Selang Stang',
  fire_extinguisher: 'APAR',
  large_tie_down_strap: 'Tali Ikat Besar',
  rearview_mirror: 'Spion',
  ati_foam: 'Busa ATI',
  small_tie_down_strap: 'Tali Ikat Kecil',
  toolbox_lock: 'Gembok Toolbox',
  service_book: 'Buku Service',
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID');
};

export default function VehicleFleetDetailPage() {
  const router = useRouter();
  const { slug, id } = router.query;
  const { companyId } = useCompany();

  // Standard Armada Hooks
  const { data: armada, isLoading: isArmadaLoading, isError: isArmadaError } = useArmadaDetail(companyId !== '3' && id ? String(id) : null);

  // Vehicle Data Hooks
  const { data: vehicleData, isLoading: isVehicleLoading, isError: isVehicleError } = useVehicleDataDetail(companyId === '3' && id ? String(id) : null);

  const handleBack = () => {
    if (slug) {
      router.push(`/dashboard/${slug}/data-kendaraan`);
    }
  };

  const isLoading = companyId === '3' ? isVehicleLoading : isArmadaLoading;
  const isError = companyId === '3' ? isVehicleError : isArmadaError;
  const hasData = companyId === '3' ? !!vehicleData : !!armada;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-[250px] w-full rounded-md" />
          <Skeleton className="h-[300px] w-full rounded-md" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !hasData) {
    return (
      <DashboardLayout>
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
          <p className="text-red-500 font-semibold">Gagal memuat detail data kendaraan</p>
          <Button onClick={handleBack} variant="outline">
            Kembali
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (companyId === '3' && vehicleData) {
    return (
      <DashboardLayout>
        <VehicleDataDetail data={vehicleData} slug={String(slug)} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <button onClick={handleBack} className="rounded-md p-1 transition-colors hover:bg-gray-100 border border-gray-200">
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Detail Kendaraan</h1>
            <p className="text-sm text-gray-500">
              Nomor Polisi <span className="font-semibold text-[#1e3a5f]">{armada?.registrationNumber}</span>
            </p>
          </div>
        </div>

        {/* Section 1: Detail Informasi */}
        <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-md space-y-6">
          <div>
            <h2 className="text-base font-bold text-gray-900">Detail Informasi</h2>
            <div className="h-px bg-gray-100 mt-4" />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-gray-500 font-medium">Nomor Polisi</Label>
              <Input value={armada?.registrationNumber} disabled className="bg-gray-50 text-gray-800 cursor-not-allowed font-semibold" />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-500 font-medium">Tipe</Label>
              <Input value={armada?.type} disabled className="bg-gray-50 text-gray-800 cursor-not-allowed" />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-500 font-medium">Nomor Mesin</Label>
              <Input value={armada?.machineNumber} disabled className="bg-gray-50 text-gray-800 cursor-not-allowed" />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-500 font-medium">Nomor Rangka</Label>
              <Input value={armada?.chassisNumber} disabled className="bg-gray-50 text-gray-800 cursor-not-allowed" />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-500 font-medium">Masa STNK</Label>
              <Input value={formatDate(armada?.stnkAge)} disabled className="bg-gray-50 text-gray-800 cursor-not-allowed" />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-500 font-medium">Masa KIR</Label>
              <Input value={formatDate(armada?.kirAge)} disabled className="bg-gray-50 text-gray-800 cursor-not-allowed" />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-500 font-medium">Nomor STNK</Label>
              <Input value={armada?.stnkNumber || '-'} disabled className="bg-gray-50 text-gray-800 cursor-not-allowed" />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-500 font-medium">Buku KIR</Label>
              <Input value={armada?.kirBook || '-'} disabled className="bg-gray-50 text-gray-800 cursor-not-allowed" />
            </div>
          </div>
        </Card>

        {/* Section 2: Perlengkapan Armada */}
        <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-md space-y-6">
          <div>
            <h2 className="text-base font-bold text-gray-900">Perlengkapan Kendaraan</h2>
            <div className="h-px bg-gray-100 mt-4" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ARMADA_EQUIPMENT_FIELDS.map((field) => {
              const qty = armada?.equipment[field];
              return (
                <div key={field} className="flex items-center justify-between p-3 rounded-md border border-gray-100 bg-gray-50/50">
                  <span className="text-sm font-medium text-gray-700">{equipmentLabels[field]}</span>
                  <span className="inline-flex items-center justify-center bg-gray-200 text-gray-800 font-bold text-xs px-2.5 py-1 rounded-full min-w-[32px]">
                    {qty != null ? qty : 0}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex items-center justify-center pt-2 pb-8">
          <Button onClick={handleBack} className="w-[150px] btn-primary-orange!">
            Kembali
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
