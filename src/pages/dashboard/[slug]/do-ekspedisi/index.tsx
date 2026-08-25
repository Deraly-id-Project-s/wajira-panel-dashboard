import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DOEkspedisiTable } from '@/components/features/do-ekspedisi/DOEkspedisiTable';
import { DeleteDOEkspedisiModal } from '@/components/features/do-ekspedisi/DeleteDOEkspedisiModal';
import { DOEkspedisiEditDialog, type DOEkspedisiEditValues } from '@/components/features/do-ekspedisi/DOEkspedisiEditDialog';
import type { DoEkspedisi } from '@/@types/do-ekspedisi.types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useDeleteDoEkspedisi,
  useDoEkspedisiDriverLookup,
  useDoEkspedisis,
  useDoEkspedisiVehicleLookup,
  useNextDoEkspedisiCode,
  useUpdateDoEkspedisi,
} from '@/hooks/useDoEkspedisi';
import { useProcessDoExpedition } from '@/hooks/useDoInvoice';
import { PageHeader } from '@/components/ui/page-header';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';

const toApiDate = (value?: Date) => {
  if (!value) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DOEkspedisiPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DoEkspedisi | null>(null);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const debouncedVehicleSearch = useDebouncedValue(vehicleSearch, 300);
  const debouncedDriverSearch = useDebouncedValue(driverSearch, 300);

  useEffect(() => {
    setSearch(debouncedSearch);
    setPage(1);
  }, [debouncedSearch, setPage, setSearch]);

  const listQuery = useDoEkspedisis({
    page,
    perPage,
    search,
    order_by: 'created_at',
    order_sort: 'desc',
  });
  const deleteMutation = useDeleteDoEkspedisi();
  const updateMutation = useUpdateDoEkspedisi();
  const processExpeditionMutation = useProcessDoExpedition();
  const nextCodeQuery = useNextDoEkspedisiCode(isEditOpen);
  const vehicleLookup = useDoEkspedisiVehicleLookup(debouncedVehicleSearch, isEditOpen);
  const driverLookup = useDoEkspedisiDriverLookup(debouncedDriverSearch, isEditOpen);

  const handleDelete = (item: DoEkspedisi) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;

    try {
      await deleteMutation.mutateAsync(selectedItem.id);
      toast.success('Data DO Ekspedisi berhasil dihapus');
      setIsDeleteOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleEditSubmit = async (values: DOEkspedisiEditValues) => {
    if (!selectedItem) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedItem.id,
        payload: {
          date: toApiDate(values.date),
          vehicle_id: values.vehicleId,
          driver_id: values.driverId,
          driver_note: values.driverNote,
        },
      });
      toast.success('Data DO Ekspedisi berhasil diperbarui');
      setIsEditOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
    }
  };

  // Memoized callbacks untuk mencegah infinite re-renders
  const handleEditClick = useCallback(
    (item: DoEkspedisi) => {
      setSelectedItem(item);
      setIsEditOpen(true);
    },
    [],
  );

  const handleDetailClick = useCallback(
    (item: DoEkspedisi) => {
      if (!slug) return;
      router.push(`/dashboard/${slug}/do-ekspedisi/detail/${item.id}`);
    },
    [slug, router],
  );

  const handlePrintClick = useCallback(
    async (item: DoEkspedisi) => {
      if (!slug) return;
      try {
        await processExpeditionMutation.mutateAsync({ id: item.id });
      } catch (error: any) {
        toast.error(getApiErrorMessage(error));
        return;
      }
      router.push(`/dashboard/${slug}/do-ekspedisi/print/${item.id}`);
    },
    [processExpeditionMutation, slug, router],
  );

  const handlePerPageChange = useCallback((value: number) => {
    setPerPage(value);
  }, []);

  // Memoized options untuk dialog
  const vehicleOptions = useMemo(
    () => (vehicleLookup.data ?? []).map((item) => ({ value: String(item.id), label: item.label, subtitle: item.subtitle })),
    [vehicleLookup.data],
  );

  const driverOptions = useMemo(
    () => (driverLookup.data ?? []).map((item) => ({ value: String(item.id), label: item.label, subtitle: item.subtitle })),
    [driverLookup.data],
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Data DO Ekspedisi"
          subtitle="Buat faktur dengan informasi penagihan yang diperlukan."
        />

        <DOEkspedisiTable
          data={listQuery.data?.data ?? []}
          search={searchInput}
          page={page}
          perPage={perPage}
          totalData={listQuery.data?.meta.total ?? 0}
          totalPages={listQuery.data?.meta.lastPage ?? 1}
          isLoading={listQuery.isLoading}
          onSearchChange={setSearchInput}
          onPageChange={setPage}
          onPerPageChange={handlePerPageChange}
          onEdit={handleEditClick}
          onDetail={handleDetailClick}
          onDelete={handleDelete}
          onPrint={(item) => {
            void handlePrintClick(item);
          }}
        />
      </div>

      <DeleteDOEkspedisiModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
        itemName={selectedItem?.doCode}
      />

      <DOEkspedisiEditDialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setSelectedItem(null);
        }}
        item={selectedItem}
        nextCode={nextCodeQuery.data}
        vehicleOptions={vehicleOptions}
        driverOptions={driverOptions}
        vehicleLoading={vehicleLookup.isLoading}
        driverLoading={driverLookup.isLoading}
        onVehicleSearch={setVehicleSearch}
        onDriverSearch={setDriverSearch}
        onSubmit={handleEditSubmit}
        isSubmitting={updateMutation.isPending}
      />
    </DashboardLayout>
  );
}
