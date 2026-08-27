import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DOEkspedisiTable } from '@/components/features/do-ekspedisi/DOEkspedisiTable';
import { DeleteDOEkspedisiModal } from '@/components/features/do-ekspedisi/DeleteDOEkspedisiModal';
import type { DoEkspedisi } from '@/@types/do-ekspedisi.types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useDeleteDoEkspedisi,
  useDoEkspedisis,
} from '@/hooks/useDoEkspedisi';
import { useProcessDoExpedition } from '@/hooks/useDoInvoice';
import { PageHeader } from '@/components/ui/page-header';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';

export default function DOEkspedisiPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DoEkspedisi | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  useEffect(() => {
    setSearch(debouncedSearch);
    setPage(1);
  }, [debouncedSearch]);

  const listQuery = useDoEkspedisis({
    page,
    perPage,
    search,
    order_by: 'created_at',
    order_sort: 'desc',
  });
  const deleteMutation = useDeleteDoEkspedisi();
  const processExpeditionMutation = useProcessDoExpedition();

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

  const handleEditClick = useCallback(
    (item: DoEkspedisi) => {
      if (!slug) return;
      router.push(`/dashboard/${slug}/do-ekspedisi/form/${item.id}`);
    },
    [slug, router],
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
    setPage(1);
  }, []);

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
    </DashboardLayout>
  );
}
