'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ChevronLeft, Save } from 'lucide-react';
import PengeluaranUnitHeaderCard from '@/components/features/pengeluaran-unit/PengeluaranUnitHeaderCard';
import PengeluaranUnitCreateTable from '@/components/features/pengeluaran-unit/PengeluaranUnitCreateTable';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import {
  useCreatePengeluaranUnit,
  useDispatchPengeluaranStock,
  useDispatchUnitRows,
  useSupplierOptions,
  useWarehouseOptions,
} from '@/hooks/usePengeluaranUnit';
import {
  PengeluaranUnitFormSchemaSubmitValues,
  PengeluaranUnitFormSchemaValues,
  pengeluaranUnitFormSchema,
} from '@/schemas/pengeluaran-unit.schema';
import { toSavePayload } from '@/services/pengeluaran-unit.service';

const getErrorMessageText = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return fallback;
  }

  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' && message.trim().length > 0 ? message : fallback;
};

export default function CreatePengeluaranUnitPage() {
  const router = useRouter();
  const createMutation = useCreatePengeluaranUnit();
  const dispatchMutation = useDispatchPengeluaranStock();
  const warehousesQuery = useWarehouseOptions();
  const suppliersQuery = useSupplierOptions();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activityId, setActivityId] = useState<number | null>(null);

  const form = useForm<PengeluaranUnitFormSchemaValues, unknown, PengeluaranUnitFormSchemaSubmitValues>({
    resolver: zodResolver(pengeluaranUnitFormSchema),
    defaultValues: {
      personId: 0,
      warehouseId: 0,
      activityDate: new Date(),
      description: '',
    },
  });

  const values = form.watch();

  useEffect(() => {
    if (values.warehouseId > 0) return;
    const firstWarehouseId = warehousesQuery.data?.[0]?.id;
    if (!firstWarehouseId) return;

    form.setValue('warehouseId', firstWarehouseId, { shouldValidate: true });
    setPage(1);
  }, [form, values.warehouseId, warehousesQuery.data]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const dispatchTableQuery = useDispatchUnitRows({
    page,
    perPage,
    search: search || undefined,
    warehouseId: values.warehouseId > 0 ? values.warehouseId : undefined,
  });

  const optionsError = getErrorMessageText(warehousesQuery.error ?? suppliersQuery.error, 'Gagal memuat opsi dropdown');
  const tableError = getErrorMessageText(dispatchTableQuery.error, 'Gagal memuat data unit untuk pengeluaran');

  const ensureActivity = async (): Promise<number | null> => {
    if (activityId) return activityId;

    const isValid = await form.trigger();
    if (!isValid) {
      toast.error('Lengkapi data pengeluaran sebelum proses kirim');
      return null;
    }

    const payload = form.getValues();
    const created = await createMutation.mutateAsync(toSavePayload(payload));
    setActivityId(created.id);
    toast.success('Data pengeluaran unit berhasil disimpan');
    return created.id;
  };

  const onSubmit = form.handleSubmit(async (payload) => {
    try {
      const created = await createMutation.mutateAsync(toSavePayload(payload));
      toast.success('Data pengeluaran unit berhasil disimpan');
      await router.push(`/dashboard/${router.query.slug}/warehouse/pengeluaran-unit/${created.id}/detail`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan data pengeluaran unit';
      toast.error(message);
    }
  });

  const handleKirim = async (ids: number[]) => {
    if (ids.length === 0) {
      toast.error('Pilih minimal satu unit');
      return;
    }

    try {
      const ensuredActivityId = await ensureActivity();
      if (!ensuredActivityId) return;

      await dispatchMutation.mutateAsync({
        warehouseActivityId: ensuredActivityId,
        detailIds: ids,
      });

      toast.success('Dispatch stock berhasil diproses');
      setSelectedIds([]);
      await dispatchTableQuery.refetch();
      await router.push(`/dashboard/${router.query.slug}/warehouse/pengeluaran-unit/${ensuredActivityId}/detail`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memproses dispatch stock';
      toast.error(message);
    }
  };

  const tableMeta = useMemo(
    () =>
      dispatchTableQuery.data?.meta ?? {
        currentPage: page,
        perPage,
        total: 0,
        lastPage: 1,
      },
    [dispatchTableQuery.data?.meta, page, perPage],
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Data Pengeluaran Unit', onClick: () => router.back() },
            { label: 'Tambah Data' }
          ]}
          title="Tambah Data Pengeluaran Unit"
          onBack={() => router.back()}
        />

        {warehousesQuery.isError || suppliersQuery.isError ? (
          <div className="rounded-md border border-red-100 bg-red-50 p-6 text-sm text-red-700 space-y-3">
            <p>{optionsError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void warehousesQuery.refetch();
                void suppliersQuery.refetch();
              }}
            >
              Coba Lagi
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <PengeluaranUnitHeaderCard
              mode="create"
              values={{
                activityNumber: activityId ? `Activity #${activityId}` : 'Auto Generate',
                activityDate: values.activityDate,
                warehouseId: values.warehouseId || undefined,
                supplierId: values.personId || undefined,
                description: values.description,
              }}
              errors={{
                activityDate: form.formState.errors.activityDate?.message,
                warehouseId: form.formState.errors.warehouseId?.message,
                supplierId: form.formState.errors.personId?.message,
                description: form.formState.errors.description?.message,
              }}
              warehouses={warehousesQuery.data ?? []}
              suppliers={suppliersQuery.data ?? []}
              isLoadingOptions={warehousesQuery.isLoading || suppliersQuery.isLoading}
              onActivityDateChange={(value) => form.setValue('activityDate', value ?? new Date(), { shouldValidate: true })}
              onWarehouseChange={(value) => {
                form.setValue('warehouseId', value, { shouldValidate: true });
                setPage(1);
              }}
              onSupplierChange={(value) => form.setValue('personId', value, { shouldValidate: true })}
              onDescriptionChange={(value) => form.setValue('description', value, { shouldValidate: true })}
            />

            <div className="bg-white rounded-md border border-gray-200 p-6 space-y-4">
              <PengeluaranUnitCreateTable
                data={dispatchTableQuery.data?.data ?? []}
                meta={tableMeta}
                search={searchInput}
                perPage={perPage}
                page={page}
                selectedIds={selectedIds}
                isLoading={dispatchTableQuery.isLoading || dispatchTableQuery.isFetching}
                isError={dispatchTableQuery.isError}
                isSubmitting={dispatchMutation.isPending || createMutation.isPending}
                errorMessage={tableError}
                onSearchChange={setSearchInput}
                onPerPageChange={(value) => {
                  setPerPage(value);
                  setPage(1);
                }}
                onPageChange={setPage}
                onSelectedIdsChange={setSelectedIds}
                onKirim={handleKirim}
                onCancel={() => router.back()}
                onRetry={() => {
                  void dispatchTableQuery.refetch();
                }}
              />
            </div>

            <div className="flex justify-center items-center gap-4 mt-8 pb-4">
              <Button type="button" variant="ghost" className="px-6 font-medium text-gray-600 hover:bg-transparent hover:text-gray-900 text-sm" onClick={() => router.back()}>
                Batal
              </Button>
              <Button type="submit" disabled={createMutation.isPending || warehousesQuery.isLoading || suppliersQuery.isLoading} className="px-6 h-10 bg-[#1e3256] hover:bg-[#15233d] text-white font-medium rounded-lg shadow-sm gap-2">
                <Save size={16} /> {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
