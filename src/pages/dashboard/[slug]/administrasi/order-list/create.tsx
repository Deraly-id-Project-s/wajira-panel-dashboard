import * as React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import type { SearchableSelectOption } from '@/components/features/vehicle-data/SearchableSelect';
import { OrderListForm, type OrderListFormValues } from '@/components/features/order-list/OrderListForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCompany } from '@/contexts/CompanyContext';
import { useCustomers } from '@/hooks/useCustomer';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useCreateOrderList, useCreateOrderListTarif, useCreateOrderListTarifItem } from '@/hooks/useOrderList';
import { useTarifs } from '@/hooks/useTarif';
import { useDrivers } from '@/hooks/useDriver';
import { useVehicleFleetLookups } from '@/hooks/useVehicleFleetLookups';
import { ApiValidationError } from '@/lib/api/response';

export default function CreateOrderListPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { companyId } = useCompany();
  const [customerSearch, setCustomerSearch] = React.useState('');
  const [tarifSearch, setTarifSearch] = React.useState('');
  const [vehicleSearch, setVehicleSearch] = React.useState('');
  const [driverSearch, setDriverSearch] = React.useState('');
  const debouncedCustomerSearch = useDebouncedValue(customerSearch, 350);
  const debouncedTarifSearch = useDebouncedValue(tarifSearch, 350);
  const debouncedVehicleSearch = useDebouncedValue(vehicleSearch, 350);
  const debouncedDriverSearch = useDebouncedValue(driverSearch, 350);

  const customerQuery = useCustomers({
    page: 1,
    perPage: 25,
    search: debouncedCustomerSearch,
    company_id: companyId ?? undefined,
  });
  const tarifQuery = useTarifs({
    page: 1,
    perPage: 100,
    search: debouncedTarifSearch,
  });
  const fusoQuery = useVehicleFleetLookups({ page: 1, perPage: 100, search: debouncedVehicleSearch, company_id: companyId ?? '', type: 'fuso' });
  const cddQuery = useVehicleFleetLookups({ page: 1, perPage: 100, search: debouncedVehicleSearch, company_id: companyId ?? '', type: 'cdd' });
  const towingQuery = useVehicleFleetLookups({ page: 1, perPage: 100, search: debouncedVehicleSearch, company_id: companyId ?? '', type: 'towing' });
  const driverQuery = useDrivers({ page: 1, perPage: 100, search: debouncedDriverSearch, company_id: companyId ?? undefined });
  const createOrderMutation = useCreateOrderList();
  const createTarifMutation = useCreateOrderListTarif();
  const createTarifItemMutation = useCreateOrderListTarifItem();

  const tarifRecords = React.useMemo(() => tarifQuery.data?.data ?? [], [tarifQuery.data?.data]);
  const customerOptions = React.useMemo<SearchableSelectOption[]>(
    () =>
      (customerQuery.data?.data ?? []).map((item) => ({
        value: String(item.id),
        label: item.name,
        subtitle: item.code,
      })),
    [customerQuery.data?.data],
  );
  const tarifOptions = React.useMemo<SearchableSelectOption[]>(
    () =>
      tarifRecords.map((item) => ({
        value: String(item.id),
        label: `${item.loadingIn || '-'} - ${item.loadingOut || '-'}`,
        subtitle: item.customer?.name,
      })),
    [tarifRecords],
  );
  const toVehicleOptions = React.useCallback((records: Array<{ id: number; registrationNumber: string; type: string }>) =>
    records.map((item) => ({ value: String(item.id), label: item.registrationNumber, subtitle: item.type.toUpperCase() })), []);
  const vehicleOptions = React.useMemo(() => ({
    fuso: toVehicleOptions(fusoQuery.data?.data ?? []),
    cdd: toVehicleOptions(cddQuery.data?.data ?? []),
    towing: toVehicleOptions(towingQuery.data?.data ?? []),
  }), [cddQuery.data?.data, fusoQuery.data?.data, towingQuery.data?.data, toVehicleOptions]);
  const driverOptions = React.useMemo<SearchableSelectOption[]>(() =>
    (driverQuery.data?.data ?? []).map((item) => ({ value: String(item.id), label: item.name, subtitle: item.code })),
  [driverQuery.data?.data]);

  const handleSubmit = async (values: OrderListFormValues) => {
    try {
      if (!companyId) {
        toast.error('Perusahaan belum dipilih');
        return;
      }
      const created = await createOrderMutation.mutateAsync({
        customer_id: Number(values.customerId),
        company_id: Number(companyId),
      });

      for (const item of values.items) {
        const createdTarif = await createTarifMutation.mutateAsync({
          do_orderlist_id: created.id,
          tarif_id: Number(item.tarifId),
          vehicle_type: item.vehicleType,
          delivery_destination: item.deliveryDestination,
          vehicle_id: Number(item.vehicleId),
          driver_id: Number(item.driverId),
        });

        for (const cargoItem of item.cargoItems) {
          await createTarifItemMutation.mutateAsync({
            do_order_list_tarif_id: createdTarif.id,
            load_content: cargoItem.loadContent,
            qty: Number(cargoItem.qty),
          });
        }
      }

      toast.success('Order list berhasil ditambahkan');
      await router.push(`/dashboard/${slug}/administrasi/order-list`);
    } catch (error: any) {
      if (error instanceof ApiValidationError) {
        toast.error(error.message || 'Validasi data order list gagal');
        return;
      }
      toast.error(error.message || 'Gagal menambahkan order list');
    }
  };

  return (
    <DashboardLayout>
      <OrderListForm
        mode="create"
        customerOptions={customerOptions}
        tarifOptions={tarifOptions}
        tarifRecords={tarifRecords}
        vehicleOptions={vehicleOptions}
        driverOptions={driverOptions}
        customerLoading={customerQuery.isLoading}
        tarifLoading={tarifQuery.isLoading}
        vehicleLoading={fusoQuery.isLoading || cddQuery.isLoading || towingQuery.isLoading}
        driverLoading={driverQuery.isLoading}
        onCustomerSearch={setCustomerSearch}
        onTarifSearch={setTarifSearch}
        onVehicleSearch={setVehicleSearch}
        onDriverSearch={setDriverSearch}
        onCancel={() => router.push(`/dashboard/${slug}/administrasi/order-list`)}
        onSubmit={handleSubmit}
        isSubmitting={createOrderMutation.isPending || createTarifMutation.isPending || createTarifItemMutation.isPending}
      />
    </DashboardLayout>
  );
}
