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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Plus, Search, Upload } from 'lucide-react';
import { AccountGroupImportModal } from '@/components/features/master-data/account-group/AccountGroupImportModal';

export const AccountGroupListPage = () => {
  const { companyId } = useCompany();
  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 25 });
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


  const { hasPermission } = usePermissionGuard();
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
    });
    setOpenForm(true);
  };

  const handleEdit = (item: AccountGroup) => {
    setEditing(item);
    form.reset({
      group_code: item.code,
      description: item.description ?? '',
    });
    setOpenForm(true);
  };

  const handleSubmit = async (values: AccountGroupFormValues) => {
    if (!companyId) {
      toast.error('ID Perusahaan tidak ditemukan');
      return;
    }

    const payload = {
      ...values,
      company_id: companyId,
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        toast.success('Grup akun berhasil diperbarui');
      } else {
        await createMutation.mutateAsync(payload);
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

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* LEFT: Search + Show */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search here"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
                <span>Show</span>
                <Select value={String(perPage)} onValueChange={(val) => { setPerPage(Number(val)); }}>
                  <SelectTrigger className="w-[70px] bg-white">
                    <SelectValue placeholder="25" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span>Page</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              {canCreate && (
                <>
                  <Button onClick={() => setOpenImport(true)} variant="outline" className="w-full sm:w-auto">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button onClick={handleAdd} className="btn-primary!">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Data
                  </Button>
                </>
              )}
            </div>
          </div>

          {isError ? (
            <div className="text-center text-red-600">Gagal memuat data grup akun</div>
          ) : (
            <AccountGroupTable
              data={data?.data ?? []}
              meta={data?.meta}
              page={page}
              canEdit={canEdit}
              canDelete={canDelete}
              perPage={perPage}
              isLoading={isLoading || isFetching}
              onEdit={handleEdit}
              onDelete={setSelectedToDelete}
              onPageChange={setPage}
              onPerPageChange={setPerPage}
            />
          )}
        </div>
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
