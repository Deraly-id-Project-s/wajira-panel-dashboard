import React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { MoneyInput } from '@/components/ui/money-input';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import { useDoEkspedisiDetail, useUpdateDoEkspedisi } from '@/hooks/useDoEkspedisi';
import { useOrderListTarifs } from '@/hooks/useOrderList';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { LoadingState } from '@/components/ui/loading-state';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { doEkspedisiEditSchema, type DoEkspedisiEditSchema } from '@/schema/do-ekspedisi.schema';
import RequiredMark from '@/components/ui/required-mark';

const toApiDateTime = (value?: Date | null) => {
  if (!value) return null;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  const seconds = String(value.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export default function EditDOEkspedisiFormPage() {
  const router = useRouter();
  const { slug, id } = router.query;

  const detailQuery = useDoEkspedisiDetail(id ? String(id) : null);
  const orderListId = detailQuery.data?.orderList?.id ?? null;

  const tarifQuery = useOrderListTarifs({
    page: 1,
    perPage: 100,
    do_orderlist_id: orderListId ?? undefined,
    order_by: 'created_at',
    order_sort: 'desc',
    enabled: Boolean(orderListId),
  });

  const updateMutation = useUpdateDoEkspedisi();

  const formMethods = useForm<DoEkspedisiEditSchema>({
    resolver: zodResolver(doEkspedisiEditSchema),
    defaultValues: {
      do_order_list_tarif_id: undefined,
      uj_nominal: 0,
      target_start_date: null,
      target_end_date: null,
    },
  });

  const { control, handleSubmit, reset } = formMethods;

  React.useEffect(() => {
    if (detailQuery.data) {
      reset({
        do_order_list_tarif_id: detailQuery.data.doOrderListTarifId || undefined,
        uj_nominal: detailQuery.data.ujNominal || 0,
        target_start_date: detailQuery.data.targetStartDate ? new Date(detailQuery.data.targetStartDate) : null,
        target_end_date: detailQuery.data.targetEndDate ? new Date(detailQuery.data.targetEndDate) : null,
      });
    }
  }, [detailQuery.data, reset]);

  const tarifOptions = React.useMemo(() => {
    return (tarifQuery.data?.data ?? []).map((tarif) => ({
      value: String(tarif.id),
      label: `[${(tarif.vehicleType || '').toUpperCase()}] ${tarif.deliveryDestination || '-'}`,
      subtitle: `${tarif.vehicle?.registrationNumber || 'Tanpa Kendaraan'} - ${tarif.driver?.name || 'Tanpa Driver'}`,
    }));
  }, [tarifQuery.data?.data]);

  const mergedTarifOptions = React.useMemo(() => {
    const currentTarif = detailQuery.data?.orderList || (detailQuery.data as any)?.order_list_tarif;
    const currentTarifId = detailQuery.data?.doOrderListTarifId;
    if (!currentTarifId) return tarifOptions;

    const currentIdStr = String(currentTarifId);
    if (tarifOptions.some((opt) => opt.value === currentIdStr)) return tarifOptions;

    const extraOption = {
      value: currentIdStr,
      label: currentTarif?.deliveryDestination || currentTarif?.delivery_destination || `Tarif #${currentTarifId}`,
      subtitle: currentTarif?.vehicleType || currentTarif?.vehicle_type || '',
    };
    return [extraOption, ...tarifOptions];
  }, [detailQuery.data, tarifOptions]);

  const handleSave = async (values: DoEkspedisiEditSchema) => {
    if (!id || !slug) return;

    try {
      await updateMutation.mutateAsync({
        id: String(id),
        payload: {
          do_order_list_tarif_id: Number(values.do_order_list_tarif_id),
          uj_nominal: Number(values.uj_nominal),
          target_start_date: toApiDateTime(values.target_start_date),
          target_end_date: toApiDateTime(values.target_end_date),
        },
      });

      toast.success('Data DO Ekspedisi berhasil diperbarui');
      router.push(`/dashboard/${slug}/do-ekspedisi`);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (!router.isReady || detailQuery.isLoading || tarifQuery.isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center text-red-500">
          Gagal memuat detail DO Ekspedisi
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'DO Ekspedisi', onClick: () => router.push(`/dashboard/${slug}/do-ekspedisi`) },
            { label: 'Form DO' },
          ]}
          title="Form Edit DO Ekspedisi"
          subtitle={`Ubah rincian pengiriman untuk kode DO: ${detailQuery.data.doCode}`}
          onBack={() => router.back()}
        />

        <div className="rounded-md border border-slate-200 bg-white p-5 md:p-8 shadow-sm space-y-6">
          <Form {...formMethods}>
            <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={control}
                  name="do_order_list_tarif_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col relative pb-5">
                      <FormLabel className="text-sm font-medium">Rute / Tarif Order List<RequiredMark /></FormLabel>
                      <FormControl>
                        <SearchableSelect
                          value={field.value ? String(field.value) : ''}
                          onChange={(val) => field.onChange(val ? Number(val) : undefined)}
                          options={mergedTarifOptions}
                          placeholder="Pilih rute ekspedisi"
                          searchPlaceholder="Cari rute..."
                          className="rounded-md"
                        />
                      </FormControl>
                      <FormMessage className="absolute bottom-0 text-[11px] leading-none text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="uj_nominal"
                  render={({ field }) => (
                    <FormItem className="flex flex-col relative pb-5">
                      <FormLabel className="text-sm font-medium">Uang Jalan Nominal<RequiredMark /></FormLabel>
                      <FormControl>
                        <MoneyInput
                          value={field.value}
                          onChangeValue={field.onChange}
                          placeholder="Nominal uang jalan"
                          className="rounded-md"
                        />
                      </FormControl>
                      <FormMessage className="absolute bottom-0 text-[11px] leading-none text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="target_start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col relative pb-5">
                      <FormLabel className="text-sm font-medium">Target Tanggal Mulai</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          value={field.value || undefined}
                          onChange={field.onChange}
                          placeholder="Pilih tanggal & waktu mulai"
                          className="rounded-md"
                        />
                      </FormControl>
                      <FormMessage className="absolute bottom-0 text-[11px] leading-none text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="target_end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col relative pb-5">
                      <FormLabel className="text-sm font-medium">Target Tanggal Selesai</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          value={field.value || undefined}
                          onChange={field.onChange}
                          placeholder="Pilih tanggal & waktu selesai"
                          className="rounded-md"
                        />
                      </FormControl>
                      <FormMessage className="absolute bottom-0 text-[11px] leading-none text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  className="min-w-[120px]"
                  onClick={() => router.back()}
                  disabled={updateMutation.isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="min-w-[120px] bg-[#1e3a5f] hover:bg-[#152e4d] text-white"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </DashboardLayout>
  );
}
