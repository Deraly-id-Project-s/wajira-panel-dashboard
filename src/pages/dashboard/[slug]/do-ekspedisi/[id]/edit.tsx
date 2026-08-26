import React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DOEkspedisiForm, type DOEkspedisiFormData } from '@/components/features/do-ekspedisi/DOEkspedisiForm';
import {
  useCreateDoEkspedisiItem,
  useDoEkspedisiCustomerLookup,
  useDoEkspedisiDetail,
  useDoEkspedisiDriverLookup,
  useDoEkspedisiVehicleLookup,
  useUpdateDoEkspedisi,
  useUpdateDoEkspedisiItem,
} from '@/hooks/useDoEkspedisi';
import { syncDoEkspedisiItemDestinations } from '@/lib/do-ekspedisi/item-destination-sync';
import { LoadingState } from '@/components/ui/loading-state';

const toApiDate = (value?: Date) => {
  if (!value) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function EditDOEkspedisiPage() {
  const router = useRouter();
  const { slug, id } = router.query;

  const [vehicleSearch, setVehicleSearch] = React.useState('');
  const [driverSearch, setDriverSearch] = React.useState('');
  const [customerSearch, setCustomerSearch] = React.useState('');

  const detailQuery = useDoEkspedisiDetail(id ? String(id) : null);
  const vehicleLookup = useDoEkspedisiVehicleLookup(vehicleSearch);
  const driverLookup = useDoEkspedisiDriverLookup(driverSearch);
  const customerLookup = useDoEkspedisiCustomerLookup(customerSearch);
  const updateExpeditionMutation = useUpdateDoEkspedisi();
  const updateItemMutation = useUpdateDoEkspedisiItem();
  const createItemMutation = useCreateDoEkspedisiItem();

  const firstItem = detailQuery.data?.items?.[0] ?? null;

  const handleSave = async (values: DOEkspedisiFormData) => {
    if (!id) return;

    try {
      await updateExpeditionMutation.mutateAsync({
        id: String(id),
        payload: {
          date: toApiDate(values.date),
          vehicle_id: values.vehicleId,
          driver_id: values.driverId,
        },
      });

      const itemPayload = {
        do_expedition_id: String(id),
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
      };

      if (firstItem) {
        const item = await updateItemMutation.mutateAsync({
          id: firstItem.id,
          payload: itemPayload,
        });

        await syncDoEkspedisiItemDestinations({
          doExpeditionItemId: item.id,
          primaryDestinationId: values.primaryDestinationId,
          primaryDestination: {
            destination: values.destination,
            driverNote: values.driverNote,
            mapsUrl: values.mapsUrl,
          },
          additionalDestinations: values.destinationStops,
          existingDestinations: firstItem.destinations ?? [],
        });
      } else {
        const item = await createItemMutation.mutateAsync(itemPayload);

        await syncDoEkspedisiItemDestinations({
          doExpeditionItemId: item.id,
          primaryDestination: {
            destination: values.destination,
            driverNote: values.driverNote,
            mapsUrl: values.mapsUrl,
          },
          additionalDestinations: values.destinationStops,
        });
      }

      toast.success('Data DO Ekspedisi berhasil diperbarui');
      if (slug) {
        router.push(`/dashboard/${slug}/do-ekspedisi`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui data DO Ekspedisi');
    }
  };

  if (detailQuery.isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (!detailQuery.data) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center text-red-500">Gagal memuat data DO Ekspedisi</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'DO Ekspedisi', onClick: () => router.push(`/dashboard/${slug}/do-ekspedisi`) },
            { label: 'Edit DO' },
          ]}
          title="Form Data Ekspedisi"
          subtitle={(
            <p className="text-sm text-slate-500">
              Nomor Polisi <span className="font-semibold text-orange-600">{detailQuery.data.vehicle?.registrationNumber || '-'}</span>
            </p>
          )}
          onBack={() => router.back()}
        />

        <div className="space-y-5">
          <DOEkspedisiForm
            mode="edit"
            initialExpedition={detailQuery.data}
            initialItem={firstItem}
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
            isSubmitting={updateExpeditionMutation.isPending || updateItemMutation.isPending || createItemMutation.isPending}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
