import { useDeferredValue, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Supplier as ApiSupplier } from '@/types/supplier.types';
import { DataImportModal } from '@/components/features/master-data/DataImportModal';
import { SupplierFormModal } from '@/components/features/supplier/SupplierFormModal';
import { SupplierTable } from '@/components/features/supplier/SupplierTable';
import { DeleteSupplierModal } from '@/components/features/supplier/DeleteSupplierModal';
import { Card } from '@/components/ui/card';
import { useCompany } from '@/contexts/CompanyContext';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { useCreateSupplier, useSuppliers, useDeleteSupplier, useExportSupplier, useImportSupplier, useUpdateSupplier } from '@/hooks/useSupplier';
import { ApiResponseError, ApiValidationError } from '@/lib/api/response';
import { createSupplierSchema, type CreateSupplierFormValues } from '@/schemas/supplier.schema';
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

  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 25 });
  const deferredSearch = useDeferredValue(search);

  const { data, isLoading, isFetching, isError } = useSuppliers({
    page,
    perPage,
    search: deferredSearch || undefined,
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
  const importSupplier = useImportSupplier();
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

  const handleImport = async (file: File) => {
    if (!canCreate) return;
    if (!companyId) {
      throw new Error('Company ID tidak ditemukan');
    }

    await importSupplier.mutateAsync({ companyId, file });
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

  if (isError) {
    return (
      <Card className="rounded-md border border-[#E4E4E7] p-6 shadow-none">
        <div className="text-center text-[15px] text-[#DC2626]">Gagal memuat data supplier</div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Supplier</h1>
            <p className="text-sm text-muted-foreground">Kelola data supplier dengan mudah</p>
          </div>
        </div>

        <SupplierTable
          suppliers={suppliers}
          isLoading={isLoadingCompany || isLoading || isFetching || !!loadingDetailId}
          search={search}
          page={page}
          perPage={perPage}
          totalData={data?.meta.total ?? suppliers.length}
          totalPages={data?.meta.lastPage ?? 1}
          onSearchChange={setSearch}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          onImport={() => setIsImportOpen(true)}
          onExport={handleExport}
          isExporting={exportSupplier.isPending}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </div>

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

      <DataImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Import Data Supplier"
        description="Unggah file .xlsx, .xls, atau .csv untuk mengimport data supplier."
        onImport={handleImport}
        isPending={importSupplier.isPending}
        accept=".xlsx,.xls,.csv,text/csv"
      />
    </>
  );
}
