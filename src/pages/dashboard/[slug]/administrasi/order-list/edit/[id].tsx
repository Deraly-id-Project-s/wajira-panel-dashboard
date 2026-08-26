import * as React from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { Tarif } from '@/@types/tarif.types';
import type { SearchableSelectOption } from '@/components/features/vehicle-data/SearchableSelect';
import { OrderListForm, type OrderListFormItemValue, type OrderListFormValues } from '@/components/features/order-list/OrderListForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCompany } from '@/contexts/CompanyContext';
import { useCustomers } from '@/hooks/useCustomer';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useCreateOrderListTarif,
  useCreateOrderListTarifItem,
  useDeleteOrderListTarifItem,
  useDeleteOrderListTarif,
  useOrderListDetail,
  useOrderListTarifItems,
  useOrderListTarifs,
  useUpdateOrderList,
  useUpdateOrderListTarifItem,
  useUpdateOrderListTarif,
} from '@/hooks/useOrderList';
import { useTarifs } from '@/hooks/useTarif';
import { useDrivers } from '@/hooks/useDriver';
import { useVehicleFleetLookups } from '@/hooks/useVehicleFleetLookups';
import { ApiValidationError } from '@/lib/api/response';
import { composeOrderListWithTarifs } from '@/services/order-list.service';
import { LoadingState } from '@/components/ui/loading-state';

const isItemChangedTarif = (initialItem: any, currentItem: OrderListFormItemValue) =>
  Number(initialItem?.tarifId ?? 0) !== Number(currentItem.tarifId || 0);

const isCargoItemChanged = (initialItem: any, currentItem: any) =>
  Number(initialItem?.qty ?? 0) !== Number(currentItem?.qty ?? 0) || String(initialItem?.loadContent ?? '') !== String(currentItem?.loadContent ?? '');

export default function EditOrderListPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const id = router.isReady && typeof router.query.id === 'string' ? Number(router.query.id) : null;
  const { companyId } = useCompany();
  const [customerSearch, setCustomerSearch] = React.useState('');
  const [tarifSearch, setTarifSearch] = React.useState('');
  const [vehicleSearch, setVehicleSearch] = React.useState('');
  const [driverSearch, setDriverSearch] = React.useState('');
  const debouncedCustomerSearch = useDebouncedValue(customerSearch, 350);
  const debouncedTarifSearch = useDebouncedValue(tarifSearch, 350);
  const debouncedVehicleSearch = useDebouncedValue(vehicleSearch, 350);
  const debouncedDriverSearch = useDebouncedValue(driverSearch, 350);

  const detailQuery = useOrderListDetail(id);
  const tarifItemQuery = useOrderListTarifs({
    page: 1,
    perPage: 100,
    do_orderlist_id: id ?? undefined,
    order_by: 'created_at',
    order_sort: 'desc',
    enabled: Boolean(id),
  });
  const tarifLoadItemQuery = useOrderListTarifItems({
    page: 1,
    perPage: 500,
    do_orderlist_id: id ?? undefined,
    order_by: 'created_at',
    order_sort: 'desc',
    enabled: Boolean(id),
  });
  const customerQuery = useCustomers({
    page: 1,
    perPage: 25,
    search: debouncedCustomerSearch,
    company_id: companyId ?? undefined,
    enabled: Boolean(companyId),
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
  const updateOrderMutation = useUpdateOrderList();
  const updateTarifMutation = useUpdateOrderListTarif();
  const createTarifMutation = useCreateOrderListTarif();
  const createTarifItemMutation = useCreateOrderListTarifItem();
  const deleteTarifMutation = useDeleteOrderListTarif();
  const updateTarifItemMutation = useUpdateOrderListTarifItem();
  const deleteTarifItemMutation = useDeleteOrderListTarifItem();
  const effectiveOrderData = React.useMemo(() => {
    if (!detailQuery.data) return null;

    const rawEntries = tarifItemQuery.data?.data?.length ? tarifItemQuery.data.data : detailQuery.data.tarifs;
    const tarifEntries = rawEntries.map((entry) => {
      const match = detailQuery.data?.tarifs?.find(
        (t) => t.tarifId === entry.tarifId || (t.uuid && t.uuid === entry.uuid)
      );
      return {
        ...entry,
        tarif: entry.tarif ?? match?.tarif,
        driverFee: entry.driverFee || match?.driverFee || 0,
        expeditionInvoice: entry.expeditionInvoice || match?.expeditionInvoice || 0,
      };
    });
    
    const tarifLoadItems = (tarifLoadItemQuery.data?.data ?? []).filter((item) => !id || Number(item.doOrderListId ?? 0) === Number(id));

    return composeOrderListWithTarifs(detailQuery.data, tarifEntries, tarifLoadItems);
  }, [detailQuery.data, id, tarifItemQuery.data?.data, tarifLoadItemQuery.data?.data]);

  const tarifRecords = React.useMemo(() => {
    const map = new Map<number, Tarif>();
    (tarifQuery.data?.data ?? []).forEach((item) => {
      map.set(item.id, item);
    });
    (effectiveOrderData?.tarifs ?? []).forEach((item) => {
      if (!item.tarif) return;
      map.set(item.tarif.id, {
        id: item.tarif.id,
        uuid: item.tarif.uuid,
        customerId: Number(item.tarif.customerId ?? 0),
        loadingIn: item.tarif.loadingIn,
        loadingOut: item.tarif.loadingOut,
        distance: Number(item.tarif.distance ?? 0),
        ujTowing: item.tarif.ujTowing ?? null,
        ujCdd: item.tarif.ujCdd ?? null,
        ujFuso: item.tarif.ujFuso ?? null,
        invCdd: item.tarif.invCdd ?? null,
        invFuso: item.tarif.invFuso ?? null,
        customer: item.tarif.customer,
      });
    });
    return Array.from(map.values());
  }, [effectiveOrderData?.tarifs, tarifQuery.data?.data]);

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

  // Handle error notifications
  React.useEffect(() => {
    if (detailQuery.isError) {
      const errorMsg =
        detailQuery.error instanceof Error
          ? detailQuery.error.message
          : 'Gagal memuat detail order list';
      toast.error(errorMsg);
    }
  }, [detailQuery.isError, detailQuery.error]);

  const handleSubmit = async (values: OrderListFormValues) => {
    if (!effectiveOrderData || !id) return;

    try {
      const firstItem = values.items[0];
      const ujDriver = values.items.reduce((sum, item) => sum + Number(item.driverFee ?? 0), 0);
      await updateOrderMutation.mutateAsync({
        id,
        payload: {
          customer_id: Number(values.customerId),
          status: values.status,
          invoice_bill: Number(values.invoiceBill),
          bill_invoice: Number(values.invoiceBill),
          vehicle_type: firstItem?.vehicleType ?? effectiveOrderData.vehicleType ?? 'fuso',
          note: values.note,
          description: values.note,
          uj_driver: ujDriver,
          loading_in: firstItem?.loadingIn ?? '',
          loading_out: firstItem?.loadingOut ?? '',
        },
      });

      const initialTarifs = effectiveOrderData.tarifs ?? [];
      const currentExistingIds = new Set(values.items.filter((item) => item.id).map((item) => Number(item.id)));
      const removedItems = initialTarifs.filter((item) => item.id && !currentExistingIds.has(item.id));

      for (const removedItem of removedItems) {
        await deleteTarifMutation.mutateAsync({ id: removedItem.id, orderListId: id });
      }

      for (const item of values.items) {
        const initialItem = initialTarifs.find((entry) => entry.id === item.id);

        if (item.id && initialItem) {
          if (isItemChangedTarif(initialItem, item)) {
            await deleteTarifMutation.mutateAsync({ id: item.id, orderListId: id });

            const createdTarif = await createTarifMutation.mutateAsync({
              do_orderlist_id: id,
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
          } else {
            await updateTarifMutation.mutateAsync({
              id: item.id,
              payload: {
                delivery_destination: item.deliveryDestination,
                tarif_id: Number(item.tarifId),
                vehicle_type: item.vehicleType,
                vehicle_id: Number(item.vehicleId),
                driver_id: Number(item.driverId),
              },
            });

            const initialCargoItems = initialItem.tarifItems ?? [];
            const currentExistingCargoIds = new Set(item.cargoItems.filter((cargoItem) => cargoItem.id).map((cargoItem) => Number(cargoItem.id)));
            const removedCargoItems = initialCargoItems.filter((cargoItem) => cargoItem.id && !currentExistingCargoIds.has(cargoItem.id));

            for (const removedCargoItem of removedCargoItems) {
              await deleteTarifItemMutation.mutateAsync({ id: removedCargoItem.id, orderListTarifId: item.id });
            }

            for (const cargoItem of item.cargoItems) {
              const initialCargoItem = initialCargoItems.find((entry) => entry.id === cargoItem.id);

              if (cargoItem.id && initialCargoItem) {
                if (!isCargoItemChanged(initialCargoItem, cargoItem)) continue;

                await updateTarifItemMutation.mutateAsync({
                  id: cargoItem.id,
                  payload: {
                    do_order_list_tarif_id: item.id,
                    load_content: cargoItem.loadContent,
                    qty: Number(cargoItem.qty),
                  },
                });
              } else {
                await createTarifItemMutation.mutateAsync({
                  do_order_list_tarif_id: item.id,
                  load_content: cargoItem.loadContent,
                  qty: Number(cargoItem.qty),
                });
              }
            }
          }
        } else {
          const createdTarif = await createTarifMutation.mutateAsync({
            do_orderlist_id: id,
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
      }

      toast.success('Order list berhasil diperbarui');
      await router.push(`/dashboard/${slug}/administrasi/order-list/detail/${id}`);
    } catch (error: any) {
      if (error instanceof ApiValidationError) {
        toast.error(error.message || 'Validasi update order list gagal');
        return;
      }
      toast.error(error.message || 'Gagal memperbarui order list');
    }
  };

  if (!router.isReady || detailQuery.isLoading || tarifItemQuery.isLoading || tarifLoadItemQuery.isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (detailQuery.isError) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.push(`/dashboard/${slug}/administrasi/order-list`)}
              className="rounded-md p-1 transition-colors hover:bg-slate-100"
            >
              <ChevronLeft className="h-5 w-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">Edit Order List</h1>
            </div>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="mb-4 text-red-700">
              {detailQuery.error instanceof Error
                ? detailQuery.error.message
                : 'Gagal memuat detail order list'}
            </p>
            <button
              onClick={() => detailQuery.refetch()}
              disabled={detailQuery.isFetching}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {detailQuery.isFetching ? 'Memuat ulang...' : 'Coba Lagi'}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!id || !effectiveOrderData) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.push(`/dashboard/${slug}/administrasi/order-list`)}
              className="rounded-md p-1 transition-colors hover:bg-slate-100"
            >
              <ChevronLeft className="h-5 w-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">Edit Order List</h1>
            </div>
          </div>

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
            <p className="mb-4 text-yellow-700">Data order list tidak ditemukan.</p>
            <button
              onClick={() => router.push(`/dashboard/${slug}/administrasi/order-list`)}
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-white transition-colors hover:bg-yellow-700"
            >
              Kembali ke Daftar
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <OrderListForm
        mode="edit"
        initialData={effectiveOrderData}
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
        isSubmitting={
          updateOrderMutation.isPending ||
          updateTarifMutation.isPending ||
          updateTarifItemMutation.isPending ||
          createTarifMutation.isPending ||
          createTarifItemMutation.isPending ||
          deleteTarifMutation.isPending ||
          deleteTarifItemMutation.isPending
        }
      />
    </DashboardLayout>
  );
}
