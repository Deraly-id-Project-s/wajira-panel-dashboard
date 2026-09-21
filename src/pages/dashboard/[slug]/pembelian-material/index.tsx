import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PurchaseMaterialFormModal } from '@/components/features/material-purchase/PurchaseMaterialFormModal';
import { PurchaseMaterialTable } from '@/components/features/material-purchase/PurchaseMaterialTable';
import type { MaterialTransaction } from '@/@types/material-transaction.types';
import { useCreateMaterialTransaction, useDeleteMaterialTransaction, useMaterialTransactions, useUpdateMaterialTransaction } from '@/hooks/useMaterialTransaction';
import { useWarehouseOptions } from '@/hooks/usePengeluaranUnit';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { ApiResponseError, ApiValidationError } from '@/lib/api/response';
import type { MaterialTransactionFormValues } from '@/scheme/material-transaction.schema';

export default function PurchaseMaterialPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { page, perPage, search, setPage, setPerPage, setSearch, updateQuery } = useQueryParamsTable({ defaultPerPage: 25 });
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [searchInput, search, setSearch]);

  const query = useMaterialTransactions({ page, perPage, search, type: 'purchase' });
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
        toast.success('Data pembelian material berhasil diperbarui');
      } else {
        await createMutation.mutateAsync({
          ...values,
          type: 'purchase',
        });
        toast.success('Data pembelian material berhasil dibuat');
      }

      setOpenForm(false);
      setEditing(null);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        toast.error(error.message || 'Validasi gagal');
        return;
      }

      const message = error instanceof ApiResponseError ? error.message : 'Gagal menyimpan data pembelian material';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Data pembelian material berhasil dihapus');
      setDeleteTarget(null);
    } catch (error) {
      const message = error instanceof ApiResponseError ? error.message : 'Gagal menghapus data pembelian material';
      toast.error(message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Pembelian Material"
          subtitle="Kelola data pembelian material"
        />

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari pembelian material"
          page={page}
          perPage={perPage}
          total={query.data?.meta.total}
          lastPage={query.data?.meta.lastPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          actions={
            <>
              {search && (
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
              )}
              <Button
                onClick={() => {
                  setEditing(null);
                  setOpenForm(true);
                }}
                className="btn-primary!"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Data
              </Button>
            </>
          }
        >
          <PurchaseMaterialTable
            slug={slug}
            data={query.data?.data ?? []}
            isLoading={query.isLoading || query.isFetching}
            onEdit={(item) => {
              setEditing(item);
              setOpenForm(true);
            }}
            onDelete={setDeleteTarget}
          />
        </SearchPagination>
      </div>

      <PurchaseMaterialFormModal
        open={openForm}
        onOpenChange={(open) => {
          setOpenForm(open);
          if (!open) setEditing(null);
        }}
        initialData={editing}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        warehouses={warehousesQuery.data ?? []}
        isLoadingWarehouses={warehousesQuery.isLoading}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data pembelian?</AlertDialogTitle>
            <AlertDialogDescription>Data pembelian material akan dihapus secara permanen.</AlertDialogDescription>
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
