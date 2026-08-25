import React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DOEkspedisiForm, type DOEkspedisiFormData } from '@/components/features/do-ekspedisi/DOEkspedisiForm';
import {
  useCreateDoEkspedisi,
  useCreateDoEkspedisiItem,
  useDoEkspedisiCustomerLookup,
  useDoEkspedisiDriverLookup,
  useDoEkspedisiVehicleLookup,
} from '@/hooks/useDoEkspedisi';
import { syncDoEkspedisiItemDestinations } from '@/lib/do-ekspedisi/item-destination-sync';
import { deleteDoEkspedisi } from '@/services/do-ekspedisi.service';

const toApiDate = (value?: Date) => {
  if (!value) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CreateDOEkspedisiPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [vehicleSearch, setVehicleSearch] = React.useState('');
  const [driverSearch, setDriverSearch] = React.useState('');
  const [customerSearch, setCustomerSearch] = React.useState('');

  const vehicleLookup = useDoEkspedisiVehicleLookup(vehicleSearch);
  const driverLookup = useDoEkspedisiDriverLookup(driverSearch);
  const customerLookup = useDoEkspedisiCustomerLookup(customerSearch);

  const createExpeditionMutation = useCreateDoEkspedisi();
  const createItemMutation = useCreateDoEkspedisiItem();

  const handleSave = async (values: DOEkspedisiFormData) => {
    let createdExpeditionId: number | null = null;

    try {
      const expedition = await createExpeditionMutation.mutateAsync({
        date: toApiDate(values.date),
        vehicle_id: values.vehicleId,
        driver_id: values.driverId,
      });
      createdExpeditionId = expedition.id;

      const item = await createItemMutation.mutateAsync({
        do_expedition_id: expedition.id,
        customer_id: values.customerId,
        loading_in: values.loadingIn,
        loading_out: values.loadingOut,
        destination: values.destination,
        invoice_fee: values.invoiceFee || 0,
        additional_cost_fee: values.additionalCostFee || 0,
        other_fee: values.otherFee || 0,
        driver_fee: values.driverFee || 0,
        driver_note: values.driverNote,
        maps_url: values.mapsUrl,
      });

      await syncDoEkspedisiItemDestinations({
        doExpeditionItemId: item.id,
        primaryDestination: {
          destination: values.destination,
          driverNote: values.driverNote,
          mapsUrl: values.mapsUrl,
        },
        additionalDestinations: values.destinationStops,
      });

      toast.success('Data DO Ekspedisi berhasil ditambahkan');
      if (slug) {
        router.push(`/dashboard/${slug}/do-ekspedisi`);
      }
    } catch (error: any) {
      if (createdExpeditionId != null) {
        try {
          await deleteDoEkspedisi(createdExpeditionId);
        } catch {
          // Keep the original error visible; rollback best effort only.
        }
      }

      toast.error(error.message || 'Gagal menyimpan data DO Ekspedisi');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'DO Ekspedisi', onClick: () => router.push(`/dashboard/${slug}/do-ekspedisi`) },
            { label: 'Tambah DO' },
          ]}
          title="Form Data Ekspedisi"
          subtitle={(
            <p className="text-sm text-slate-500">
              Nomor Polisi akan mengikuti armada yang dipilih
            </p>
          )}
          onBack={() => router.back()}
        />

        <div className="space-y-5">
          <DOEkspedisiForm
            mode="create"
            vehicleOptions={(vehicleLookup.data ?? []).map((item) => ({ value: String(item.id), label: item.label, subtitle: item.subtitle }))}
            driverOptions={(driverLookup.data ?? []).map((item) => ({ value: String(item.id), label: item.label, subtitle: item.subtitle }))}
            customerOptions={(customerLookup.data ?? []).map((item) => ({ value: String(item.id), label: item.label, subtitle: item.subtitle }))}
            vehicleLoading={vehicleLookup.isLoading}
            driverLoading={driverLookup.isLoading}
            customerLoading={customerLookup.isLoading}
            onVehicleSearch={setVehicleSearch}
            onDriverSearch={setDriverSearch}
            onCustomerSearch={setCustomerSearch}
            onSubmit={handleSave}
            isSubmitting={createExpeditionMutation.isPending || createItemMutation.isPending}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
