import { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PurchaseMaterialFormModal } from '@/components/features/material-purchase/PurchaseMaterialFormModal';
import { PurchaseMaterialTable } from '@/components/features/material-purchase/PurchaseMaterialTable';
import type { MaterialTransaction } from '@/types/material-transaction.types';
import { useCreateMaterialTransaction, useDeleteMaterialTransaction, useMaterialTransactions, useUpdateMaterialTransaction } from '@/hooks/useMaterialTransaction';
import { useWarehouseOptions } from '@/hooks/usePengeluaranUnit';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { ApiResponseError, ApiValidationError } from '@/lib/api/response';
import type { MaterialTransactionFormValues } from '@/schemas/material-transaction.schema';

export default function SalesMaterialPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 25 });

  const query = useMaterialTransactions({ page, perPage, search, type: 'sales' });
  const warehousesQuery = useWarehouseOptions();
  const createMutation = useCreateMaterialTransaction();
  const updateMutation = useUpdateMaterialTransaction();
  const deleteMutation = useDeleteMaterialTransaction();

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<MaterialTransaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MaterialTransaction | null>(null);

  const handleSubmit = async (values: MaterialTransactionFormValues) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          payload: values,
        });
        toast.success('Data penjualan material berhasil diperbarui');
      } else {
        await createMutation.mutateAsync({
          ...values,
          type: 'sales',
        });
        toast.success('Data penjualan material berhasil dibuat');
      }

      setOpenForm(false);
      setEditing(null);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        toast.error(error.message || 'Validasi gagal');
        return;
      }

      const message = error instanceof ApiResponseError ? error.message : 'Gagal menyimpan data penjualan material';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Data penjualan material berhasil dihapus');
      setDeleteTarget(null);
    } catch (error) {
      const message = error instanceof ApiResponseError ? error.message : 'Gagal menghapus data penjualan material';
      toast.error(message);
    }
  };

  return (
    <DashboardLayout>
      <PurchaseMaterialTable
        slug={slug}
        data={query.data?.data ?? []}
        totalData={query.data?.meta.total ?? 0}
        page={page}
        perPage={perPage}
        search={search}
        isLoading={query.isLoading || query.isFetching}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        onSearchChange={setSearch}
        onAdd={() => {
          setEditing(null);
          setOpenForm(true);
        }}
        onEdit={(item) => {
          setEditing(item);
          setOpenForm(true);
        }}
        onDelete={setDeleteTarget}
        title="Penjualan Material"
        description="Kelola data penjualan material"
        codeHeader="KODE JUAL"
        dateHeader="TGL JUAL"
        counterpartyHeader="CUSTOMER"
        routeBasePath="penjualan-material"
        loadingText="Memuat data penjualan material..."
        emptyText="Tidak ada data penjualan material."
      />

      <PurchaseMaterialFormModal
        open={openForm}
        onOpenChange={(open) => {
          setOpenForm(open);
          if (!open) setEditing(null);
        }}
        initialData={editing}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        addTitle="Tambah Data Jual"
        editTitle="Edit Data Jual"
        codeLabel="Kode Penjualan"
        counterpartyLabel="Nama Customer"
        counterpartyPlaceholder="Masukkan customer"
        dateLabel="Tanggal Penjualan"
        descriptionLabel="Keterangan"
        descriptionPlaceholder="Masukkan keterangan penjualan"
        totalPaidLabel="Total Terima"
        warehouses={warehousesQuery.data ?? []}
        isLoadingWarehouses={warehousesQuery.isLoading}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data penjualan?</AlertDialogTitle>
            <AlertDialogDescription>Data penjualan material akan dihapus secara permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending} className="bg-red-600 hover:bg-red-700">
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
