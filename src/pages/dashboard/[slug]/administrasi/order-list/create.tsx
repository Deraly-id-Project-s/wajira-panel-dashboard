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
import { ApiValidationError } from '@/lib/api/response';
import { summarizeTarifCargoItems } from '@/components/features/order-list/order-list.utils';

export default function CreateOrderListPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { companyId } = useCompany();
  const [customerSearch, setCustomerSearch] = React.useState('');
  const [tarifSearch, setTarifSearch] = React.useState('');
  const debouncedCustomerSearch = useDebouncedValue(customerSearch, 350);
  const debouncedTarifSearch = useDebouncedValue(tarifSearch, 350);

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

  const handleSubmit = async (values: OrderListFormValues) => {
    try {
      const firstItem = values.items[0];
      const created = await createOrderMutation.mutateAsync({
        customer_id: Number(values.customerId),
        status: values.status,
        bill_invoice: Number(values.invoiceBill),
        vehicle_type: firstItem?.vehicleType ?? 'fuso',
        note: values.note,
        uj_driver: Number(values.ujDriver),
        loading_in: firstItem?.loadingIn ?? '',
        loading_out: firstItem?.loadingOut ?? '',
      });

      for (const item of values.items) {
        const tarifSummary = summarizeTarifCargoItems(item.cargoItems);
        const createdTarif = await createTarifMutation.mutateAsync({
          do_orderlist_id: created.id,
          tarif_id: Number(item.tarifId),
          qty: tarifSummary.qty,
          load_content: tarifSummary.loadContent,
          delivery_destination: item.deliveryDestination,
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
        customerLoading={customerQuery.isLoading}
        tarifLoading={tarifQuery.isLoading}
        onCustomerSearch={setCustomerSearch}
        onTarifSearch={setTarifSearch}
        onCancel={() => router.push(`/dashboard/${slug}/administrasi/order-list`)}
        onSubmit={handleSubmit}
        isSubmitting={createOrderMutation.isPending || createTarifMutation.isPending || createTarifItemMutation.isPending}
      />
    </DashboardLayout>
  );
}
