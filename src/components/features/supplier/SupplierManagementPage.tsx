import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Supplier as ApiSupplier } from '@/@types/supplier.types';
import { SupplierFormModal } from '@/components/features/supplier/SupplierFormModal';
import { SupplierImportModal } from '@/components/features/supplier/SupplierImportModal';
import { SupplierTable } from '@/components/features/supplier/SupplierTable';
import { DeleteSupplierModal } from '@/components/features/supplier/DeleteSupplierModal';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { useCompany } from '@/contexts/CompanyContext';
import { Download, Plus, Upload } from 'lucide-react';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { useCreateSupplier, useSuppliers, useDeleteSupplier, useExportSupplier, useUpdateSupplier } from '@/hooks/useSupplier';
import { ApiResponseError, ApiValidationError } from '@/lib/api/response';
import { createSupplierSchema, type CreateSupplierFormValues } from '@/scheme/supplier.schema';
import { getSupplierById } from '@/services/supplier.service';
import { useAuthMe } from '@/features/auth/hooks/use-auth-me';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { toast } from 'sonner';

const defaultSupplierValues: CreateSupplierFormValues = {
  name: '',
  address: '',
  npwp: '',
  pic: '',
  phone: '',
};

const normalizeCompanyId = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
};

const filterSuppliersByCompany = (suppliers: ApiSupplier[], companyId: string | null) => {
  const normalizedCompanyId = normalizeCompanyId(companyId);

  if (!normalizedCompanyId) {
    return suppliers;
  }

  return suppliers.filter((supplier) => normalizeCompanyId(supplier.companyId) === normalizedCompanyId);
};

const applyValidationErrors = (
  error: ApiValidationError,
  form: ReturnType<typeof useForm<CreateSupplierFormValues>>,
) => {
  Object.entries(error.fieldErrors).forEach(([field, messages]) => {
    const mappedField = field === 'pic_name' ? 'pic' : field;
    form.setError(mappedField as keyof CreateSupplierFormValues, { message: messages?.[0] || 'Validasi gagal' });
  });
};

export function SupplierManagementPage() {
  const { companyId, isLoading: isLoadingCompany } = useCompany();
  const { data: profile } = useAuthMe();
  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');

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

  const { data, isLoading, isFetching, isError } = useSuppliers({
    page,
    perPage,
    search,
    company_id: companyId ?? undefined,
    enabled: !isLoadingCompany && !!companyId,
  });

  const suppliers = useMemo(
    () => filterSuppliersByCompany(data?.data ?? [], companyId),
    [companyId, data?.data],
  );

  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const exportSupplier = useExportSupplier();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ApiSupplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiSupplier | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | number | null>(null);

  const form = useForm<CreateSupplierFormValues>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: defaultSupplierValues,
  });

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingSupplier(null);
    form.reset(defaultSupplierValues);
  };

  const handleAdd = () => {
    if (!canCreate) return;
    setEditingSupplier(null);
    form.reset(defaultSupplierValues);
    setIsFormOpen(true);
  };

  const handleEdit = async (supplier: ApiSupplier) => {
    if (!canEdit) return;
    setLoadingDetailId(supplier.id);

    try {
      const detail = await getSupplierById(supplier.id);
      setEditingSupplier(detail);
      form.reset({
        name: detail.name,
        address: detail.address ?? '',
        npwp: detail.npwp ?? '',
        pic: detail.pic ?? '',
        phone: detail.phone ?? '',
      });
      setIsFormOpen(true);
    } catch (error) {
      const message = error instanceof ApiResponseError ? error.message : 'Gagal memuat detail supplier';
      toast.error(message);
    } finally {
      setLoadingDetailId(null);
    }
  };

  const handleSubmit = async (values: CreateSupplierFormValues) => {
    if (editingSupplier && !canEdit) return;
    if (!editingSupplier && !canCreate) return;

    if (!companyId) {
      toast.error('Company ID tidak ditemukan');
      return;
    }

    if (!profile?.data?.id) {
      toast.error('User belum dimuat, silakan coba lagi');
      return;
    }

    const payload = {
      ...values,
      pic: values.pic || undefined,
      phone: values.phone || undefined,
      companyId: Number(companyId) || companyId,
      userId: Number(profile.data.id) || profile.data.id,
    };

    try {
      if (editingSupplier) {
        await updateSupplier.mutateAsync({ id: editingSupplier.id, payload });
        toast.success('Data supplier berhasil diperbarui');
      } else {
        await createSupplier.mutateAsync(payload);
        toast.success('Data supplier berhasil ditambahkan');
      }

      handleCloseForm();
      setTimeout(() => {
        document.body.style.pointerEvents = 'auto';
      }, 100);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        applyValidationErrors(error, form);
        toast.error(error.message || 'Validasi gagal');
        return;
      }

      const message = error instanceof ApiResponseError ? error.message : 'Gagal menyimpan data supplier';
      toast.error(message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!canDelete) return;
    if (!deleteTarget || !companyId) return;

    try {
      await deleteSupplier.mutateAsync({ id: deleteTarget.id, companyId });
      toast.success('Data supplier berhasil dihapus');
      setDeleteTarget(null);
      setTimeout(() => {
        document.body.style.pointerEvents = 'auto';
      }, 100);
    } catch (error) {
      const message = error instanceof ApiResponseError ? error.message : 'Gagal menghapus data supplier';
      toast.error(message);
    }
  };



  const handleExport = async () => {
    try {
      if (!companyId) {
        throw new Error('Company ID tidak ditemukan');
      }

      await exportSupplier.mutateAsync(companyId);
      toast.success('File supplier berhasil didownload');
    } catch (error) {
      const message = error instanceof ApiResponseError ? error.message : 'Gagal mengexport data supplier';
      toast.error(message);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Supplier</h1>
            <p className="text-sm text-muted-foreground">Kelola data supplier dengan mudah</p>
          </div>
        </div>

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari supplier"
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
                  className="rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer h-9 text-xs px-3"
                >
                  Reset
                </Button>
              )}
              <Button onClick={handleExport} disabled={exportSupplier.isPending} variant="outline" className="h-9 text-xs px-3 rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">
                <Download className="h-4 w-4 mr-2" />
                {exportSupplier.isPending ? 'Exporting...' : 'Export'}
              </Button>
              {canCreate && (
                <>
                  <Button onClick={() => setIsImportOpen(true)} variant="outline" className="h-9 text-xs px-3 rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button onClick={handleAdd} className="btn-primary!">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Data
                  </Button>
                </>
              )}
            </>
          }
        >
          {isError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-base text-red-600">
              Gagal memuat data supplier.
            </div>
          ) : (
            <SupplierTable
              suppliers={suppliers}
              isLoading={isLoadingCompany || isLoading || isFetching || !!loadingDetailId}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          )}
        </SearchPagination>
      </div>

      <SupplierImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
      />

      <SupplierFormModal
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseForm();
            return;
          }

          setIsFormOpen(open);
        }}
        form={form}
        onSubmit={handleSubmit}
        title={editingSupplier ? 'Edit Data Supplier' : 'Tambah Data Supplier'}
        description={editingSupplier ? 'Edit detail supplier' : 'Masukkan detail supplier baru'}
        submitLabel="Simpan"
        isSubmitting={createSupplier.isPending || updateSupplier.isPending}
      />

      <DeleteSupplierModal
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        supplierName={deleteTarget?.name ?? null}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteSupplier.isPending}
      />
    </>
  );
}
