import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { AccountGroupTable } from './AccountGroupTable';
import { AccountGroupFormModal } from './AccountGroupFormModal';
import { useAccountGroups, useDeleteAccountGroup, useCreateAccountGroup, useUpdateAccountGroup } from '@/hooks/useAccountGroup';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import type { AccountGroup } from '@/@types/account-group.types';
import { accountGroupSchema, type AccountGroupFormValues } from '@/scheme/account-group.schema';
import { toast } from 'sonner';
import { ApiResponseError, ApiValidationError } from '@/lib/api/response';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { Plus, Upload } from 'lucide-react';
import { AccountGroupImportModal } from '@/components/features/master-data/account-group/AccountGroupImportModal';

export const AccountGroupListPage = () => {
  const { companyId } = useCompany();
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

  const { data, isLoading, isError, isFetching } = useAccountGroups({
    page,
    perPage,
    search,
    company_id: companyId ?? undefined,
    enabled: !!companyId,
  });
  const createMutation = useCreateAccountGroup();
  const updateMutation = useUpdateAccountGroup();
  const deleteMutation = useDeleteAccountGroup(companyId ?? undefined);


  const { hasPermission, canManageMasterDataLock } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');

  const [selectedToDelete, setSelectedToDelete] = useState<AccountGroup | null>(null);
  const [editing, setEditing] = useState<AccountGroup | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [openImport, setOpenImport] = useState(false);

  const form = useForm<AccountGroupFormValues>({
    resolver: zodResolver(accountGroupSchema),
    defaultValues: {
      group_code: '',
      description: '',
    },
  });



  const handleDelete = async () => {
    if (!selectedToDelete) return;
    try {
      await deleteMutation.mutateAsync(selectedToDelete.id);
      toast.success('Grup akun berhasil dihapus');
      setTimeout(() => {
        document.body.style.pointerEvents = 'auto';
      }, 100);
    } catch (error) {
      const message = error instanceof ApiResponseError ? error.message : 'Gagal menghapus grup akun';
      toast.error(message);
    } finally {
      setSelectedToDelete(null);
    }
  };

  const handleAdd = () => {
    setEditing(null);
    form.reset({
      group_code: '',
      description: '',
      is_lock: false,
    });
    setOpenForm(true);
  };

  const handleEdit = (item: AccountGroup) => {
    setEditing(item);
    form.reset({
      group_code: item.code,
      description: item.description ?? '',
      is_lock: !!item.is_lock,
    });
    setOpenForm(true);
  };

  const handleSubmit = async (values: AccountGroupFormValues) => {
    if (!companyId) {
      toast.error('ID Perusahaan tidak ditemukan');
      return;
    }

    try {
      if (editing) {
        const isDescriptionOnlyUpdate = Boolean(editing.is_lock && !canManageMasterDataLock);
        const updatePayload = {
          company_id: companyId,
          ...(isDescriptionOnlyUpdate
            ? { description: values.description }
            : {
              group_code: values.group_code,
              description: values.description,
              ...(canManageMasterDataLock ? { is_lock: !!values.is_lock } : {}),
            }),
        };

        await updateMutation.mutateAsync({ id: editing.id, payload: updatePayload });
        toast.success('Grup akun berhasil diperbarui');
      } else {
        const createPayload = {
          company_id: companyId,
          group_code: values.group_code,
          description: values.description,
        };

        await createMutation.mutateAsync(createPayload);
        toast.success('Grup akun berhasil dibuat');
      }
      setOpenForm(false);
      setEditing(null);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        Object.entries(error.fieldErrors).forEach(([field, messages]) => {
          const fieldName = field === 'group_code' ? 'group_code' : field;
          form.setError(fieldName as any, { message: messages?.[0] || 'Validasi gagal' });
        });
        toast.error(error.message || 'Validasi gagal');
        return;
      }
      toast.error(editing ? 'Gagal memperbarui grup akun' : 'Gagal membuat grup akun');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Grup Akun"
          subtitle="Kelola grup akun untuk mengatur akun transaksi"
        />

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari grup akun"
          page={page}
          perPage={perPage}
          total={data?.meta.total}
          lastPage={data?.meta.lastPage}
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
                >
                  Reset
                </Button>
              )}
              {canCreate && (
                <>
                  <Button onClick={() => setOpenImport(true)} variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button variant="default" onClick={handleAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Data
                  </Button>
                </>
              )}
            </>
          }
        >
          {isError ? (
            <div className="text-center text-red-600">Gagal memuat data grup akun</div>
          ) : (
            <AccountGroupTable
              data={data?.data ?? []}
              canEdit={canEdit}
              canDelete={canDelete}
              isLoading={isLoading || isFetching}
              onEdit={handleEdit}
              onDelete={setSelectedToDelete}
            />
          )}
        </SearchPagination>
      </div>

      <AccountGroupFormModal
        open={openForm}
        onOpenChange={setOpenForm}
        form={form}
        onSubmit={handleSubmit}
        title={editing ? 'Edit Grup Akun' : 'Tambah Grup Akun'}
        description={editing ? 'Perbarui informasi grup akun' : 'Buat grup akun baru untuk mengelompokkan akun'}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        submitLabel={editing ? 'Perbarui' : 'Simpan'}
        disableGroupCode={Boolean(editing?.is_lock && !canManageMasterDataLock)}
        showLockField={Boolean(editing && canManageMasterDataLock)}
      />

      <AccountGroupImportModal
        open={openImport}
        onOpenChange={setOpenImport}
      />

      <AlertDialog open={!!selectedToDelete} onOpenChange={(open) => !open && setSelectedToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Grup Akun?</AlertDialogTitle>
            <AlertDialogDescription>Data yang dihapus tidak dapat dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};
