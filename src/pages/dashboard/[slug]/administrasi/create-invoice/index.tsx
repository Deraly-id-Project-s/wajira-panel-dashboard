import * as React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import type { DoInvoiceTableRow } from '@/@types/create-invoice.types';
import { CreateInvoiceDeleteDialog } from '@/components/features/create-invoice/CreateInvoiceDeleteDialog';
import { CreateInvoiceModal } from '@/components/features/create-invoice/CreateInvoiceModal';
import { CreateInvoiceTable } from '@/components/features/create-invoice/CreateInvoiceTable';
import { matchesInvoiceSearch, toDoInvoiceTableRow } from '@/components/features/create-invoice/create-invoice.utils';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useCreateDoInvoice, useDeleteDoInvoice, useDoInvoices } from '@/hooks/useDoInvoice';

import { getApiErrorMessage } from '@/utils/apiErrorHandler';

export default function CreateInvoiceListPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(25);
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [dateFilter, setDateFilter] = React.useState('');
  const [printFilter, setPrintFilter] = React.useState<'' | '0' | '1'>('');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedRow, setSelectedRow] = React.useState<DoInvoiceTableRow | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);

  React.useEffect(() => {
    setSearch(debouncedSearch.trim());
    setPage(1);
  }, [debouncedSearch, setPage]);

  const listQuery = useDoInvoices({
    page,
    perPage,
    search,
    order_by: 'created_at',
    order_sort: sortOrder,
    date: dateFilter || undefined,
    is_printed: printFilter,
  });
  const createMutation = useCreateDoInvoice();
  const deleteMutation = useDeleteDoInvoice();

  const rows = React.useMemo(() => (listQuery.data?.data ?? []).map(toDoInvoiceTableRow), [listQuery.data?.data]);
  const filteredRows = React.useMemo(() => rows.filter((row) => matchesInvoiceSearch(row, searchInput)), [rows, searchInput]);

  const handleCreate = async (values: { customer_id: number; date: string; subject: string; letter_content: string; description: string }) => {
    try {
      await createMutation.mutateAsync(values);
      toast.success('Create invoice berhasil ditambahkan');
      setCreateOpen(false);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!selectedRow) return;
    try {
      await deleteMutation.mutateAsync({ id: selectedRow.id, payload: { do_code: selectedRow.code } });
      toast.success('Create invoice berhasil dihapus');
      setDeleteOpen(false);
      setSelectedRow(null);
      setSelectedIds((current) => current.filter((item) => item !== selectedRow.id));
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const redirectToPrint = async (row: DoInvoiceTableRow) => {
    await router.push(`/dashboard/${slug}/administrasi/create-invoice/detail/${row.id}`);
  };

  return (
    <DashboardLayout>
      <CreateInvoiceTable
        rows={filteredRows}
        search={searchInput}
        isLoading={listQuery.isLoading}
        page={page}
        perPage={perPage}
        totalData={listQuery.data?.meta.total ?? 0}
        sortOrder={sortOrder}
        printFilter={printFilter}
        dateFilter={dateFilter}
        selectedIds={selectedIds}
        isProcessing={false}
        onSearchChange={setSearchInput}
        onPageChange={setPage}
        onPerPageChange={(value) => {
          setPerPage(value);
        }}
        onSortOrderChange={(value) => {
          setSortOrder(value);
          setPage(1);
        }}
        onPrintFilterChange={(value) => {
          setPrintFilter(value);
          setPage(1);
        }}
        onDateFilterChange={(value) => {
          setDateFilter(value);
          setPage(1);
        }}
        onResetFilters={() => {
          setSearchInput('');
          setSearch('');
          setDateFilter('');
          setPrintFilter('');
          setSortOrder('desc');
          setPerPage(10);
        }}
        onAdd={() => setCreateOpen(true)}
        onDetail={(row) => router.push(`/dashboard/${slug}/administrasi/create-invoice/detail/${row.id}`)}
        onPrint={redirectToPrint}
        onDelete={(row) => {
          setSelectedRow(row);
          setDeleteOpen(true);
        }}
        onToggleRow={(id, checked) =>
          setSelectedIds((current) => (checked ? Array.from(new Set([...current, id])) : current.filter((item) => item !== id)))
        }
        onToggleAll={(checked) => setSelectedIds(checked ? filteredRows.map((item) => item.id) : [])}
        onProcessSelected={() => router.push(`/dashboard/${slug}/administrasi/create-invoice/print/bulk?ids=${selectedIds.join(',')}`)}
      />

      <CreateInvoiceModal open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreate} isSubmitting={createMutation.isPending} />

      <CreateInvoiceDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} isDeleting={deleteMutation.isPending} itemName={selectedRow?.code} />
    </DashboardLayout>
  );
}
