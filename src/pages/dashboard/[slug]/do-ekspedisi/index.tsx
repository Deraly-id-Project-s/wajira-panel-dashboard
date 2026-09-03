import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import type { DateRange } from 'react-day-picker';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DOEkspedisiTable } from '@/components/features/do-ekspedisi/DOEkspedisiTable';
import { DeleteDOEkspedisiModal } from '@/components/features/do-ekspedisi/DeleteDOEkspedisiModal';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import type { DoEkspedisi } from '@/@types/do-ekspedisi.types';
import {
  useDeleteDoEkspedisi,
  useDoEkspedisis,
} from '@/hooks/useDoEkspedisi';
import { useProcessDoExpedition } from '@/hooks/useDoInvoice';
import { PageHeader } from '@/components/ui/page-header';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';

export default function DOEkspedisiPage() {
  const router = useRouter();
  const { slug } = router.query;

  const { page, perPage, search, setPage, setPerPage, setSearch, updateQuery } = useQueryParamsTable({
    defaultPerPage: 25,
  });
  const [searchInput, setSearchInput] = useState(search);
  const [date, setDate] = useState<DateRange | undefined>();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DoEkspedisi | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [searchInput, search, setSearch]);

  const handleDateChange = (next?: DateRange) => {
    setDate(next);
    setPage(1);
  };

  const listQuery = useDoEkspedisis({
    page,
    perPage,
    search,
    order_by: 'created_at',
    order_sort: 'desc',
    start_date: date?.from ? date.from.toISOString().split('T')[0] : undefined,
    end_date: date?.to ? date.to.toISOString().split('T')[0] : undefined,
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Data DO Ekspedisi"
          subtitle="Buat faktur dengan informasi penagihan yang diperlukan."
        />

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari DO ekspedisi"
          page={page}
          perPage={perPage}
          total={listQuery.data?.meta.total}
          lastPage={listQuery.data?.meta.lastPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          filters={
            <DatePickerWithRange
              date={date}
              onChange={handleDateChange}
              placeholder="Pilih rentang tanggal"
              className="w-full sm:w-[260px]"
            />
          }
          actions={
            search ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchInput('');
                  updateQuery({ search: undefined, page: 1 });
                }}
                className="rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer h-9 text-xs px-3"
              >
                Reset
              </Button>
            ) : null
          }
        >
          <DOEkspedisiTable
            data={listQuery.data?.data ?? []}
            isLoading={listQuery.isLoading}
            onEdit={handleEditClick}
            onDetail={handleDetailClick}
            onDelete={handleDelete}
            onPrint={(item) => {
              void handlePrintClick(item);
            }}
          />
        </SearchPagination>
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
