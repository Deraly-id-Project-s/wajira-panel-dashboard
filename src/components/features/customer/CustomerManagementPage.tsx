import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Customer as ApiCustomer } from '@/@types/customer.types';
import { CustomerFormModal } from '@/components/features/customer/CustomerFormModal';
import { CustomerImportModal } from '@/components/features/customer/CustomerImportModal';
import { CustomerTable } from '@/components/features/customer/CustomerTable';
import { DeleteCustomerModal } from '@/components/features/customer/DeleteCustomerModal';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { useCompany } from '@/contexts/CompanyContext';
import { Download, Plus, Upload } from 'lucide-react';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { useCreateCustomer, useCustomers, useDeleteCustomer, useExportCustomer, useUpdateCustomer } from '@/hooks/useCustomer';
import { ApiResponseError, ApiValidationError } from '@/lib/api/response';
import { customerSchema, type CustomerFormValues } from '@/scheme/customer.schema';
import { getCustomerById } from '@/services/customer.service';
import { toast } from 'sonner';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

const defaultCustomerValues: CustomerFormValues = {
  name: '',
  address: '',
  npwp: '',
  pic: '',
  phone: '',
  map_link: '',
  map_coordinat: null,
};

const normalizeCompanyId = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
};

const filterCustomersByCompany = (customers: ApiCustomer[], companyId: string | null) => {
  const normalizedCompanyId = normalizeCompanyId(companyId);

  if (!normalizedCompanyId) {
    return customers;
  }

  return customers.filter((customer) => normalizeCompanyId(customer.companyId) === normalizedCompanyId);
};

const applyValidationErrors = (
  error: ApiValidationError,
  form: ReturnType<typeof useForm<CustomerFormValues>>,
) => {
  Object.entries(error.fieldErrors).forEach(([field, messages]) => {
    const mappedField = field === 'pic_name' ? 'pic' : field;
    form.setError(mappedField as keyof CustomerFormValues, { message: messages?.[0] || 'Validasi gagal' });
  });
};

export function CustomerManagementPage() {
  const { companyId, isLoading: isLoadingCompany } = useCompany();
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

  const { data, isLoading, isFetching, isError } = useCustomers({
    page,
    perPage,
    search,
    company_id: companyId ?? undefined,
    enabled: !isLoadingCompany && !!companyId,
  });

  const customers = useMemo(
    () => filterCustomersByCompany(data?.data ?? [], companyId),
    [companyId, data?.data],
  );

  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const exportCustomer = useExportCustomer();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<ApiCustomer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiCustomer | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | number | null>(null);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: defaultCustomerValues,
  });

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCustomer(null);
    form.reset(defaultCustomerValues);
  };

  const handleAdd = () => {
    if (!canCreate) return;
    setEditingCustomer(null);
    form.reset(defaultCustomerValues);
    setIsFormOpen(true);
  };

  const handleEdit = async (customer: ApiCustomer) => {
    if (!canEdit) return;
    setLoadingDetailId(customer.id);

    try {
      const detail = await getCustomerById(customer.id);
      setEditingCustomer(detail);
      form.reset({
        name: detail.name,
        address: detail.address ?? '',
        npwp: detail.npwp ?? '',
        pic: detail.pic ?? '',
        phone: detail.phone ?? '',
        map_link: detail.map_link ?? '',
        map_coordinat: detail.mapCoordinat ?? null,
      });
      setIsFormOpen(true);
    } catch (error) {
      const message = error instanceof ApiResponseError ? error.message : 'Gagal memuat detail customer';
      toast.error(message);
    } finally {
      setLoadingDetailId(null);
    }
  };

  const handleSubmit = async (values: CustomerFormValues) => {
    if (editingCustomer && !canEdit) return;
    if (!editingCustomer && !canCreate) return;

    if (!companyId) {
      toast.error('Company ID tidak ditemukan');
      return;
    }

    const payload = {
      ...values,
      companyId: Number(companyId) || companyId,
    };

    try {
      if (editingCustomer) {
        await updateCustomer.mutateAsync({ id: editingCustomer.id, payload });
        toast.success('Data customer berhasil diperbarui');
      } else {
        await createCustomer.mutateAsync(payload);
        toast.success('Data customer berhasil ditambahkan');
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

      const message = error instanceof ApiResponseError ? error.message : 'Gagal menyimpan data customer';
      toast.error(message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!canDelete) return;
    if (!deleteTarget || !companyId) return;

    try {
      await deleteCustomer.mutateAsync({ id: deleteTarget.id, companyId });
      toast.success('Data customer berhasil dihapus');
      setDeleteTarget(null);
      setTimeout(() => {
        document.body.style.pointerEvents = 'auto';
      }, 100);
    } catch (error) {
      const message = error instanceof ApiResponseError ? error.message : 'Gagal menghapus data customer';
      toast.error(message);
    }
  };



  const handleExport = async () => {
    try {
      if (!companyId) {
        throw new Error('Company ID tidak ditemukan');
      }

      await exportCustomer.mutateAsync(companyId);
      toast.success('File customer berhasil didownload');
    } catch (error) {
      const message = error instanceof ApiResponseError ? error.message : 'Gagal mengexport data customer';
      toast.error(message);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Customer</h1>
            <p className="text-sm text-muted-foreground">Kelola data customer dengan mudah</p>
          </div>
        </div>

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari customer"
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
              <Button onClick={handleExport} disabled={exportCustomer.isPending} variant="outline" className="h-9 text-xs px-3 rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">
                <Download className="h-4 w-4 mr-2" />
                {exportCustomer.isPending ? 'Exporting...' : 'Export'}
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
            <div className="rounded-md border border-red-200 bg-red-50 px-6 py-5 text-base text-red-600">
              Gagal memuat data customer.
            </div>
          ) : (
            <CustomerTable
              customers={customers}
              isLoading={isLoadingCompany || isLoading || isFetching || !!loadingDetailId}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          )}
        </SearchPagination>
      </div>

      <CustomerImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
      />

      <CustomerFormModal
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
        title={editingCustomer ? 'Edit Data Customer' : 'Tambah Data Customer'}
        description={editingCustomer ? 'Edit detail customer' : 'Masukkan detail customer baru'}
        submitLabel="Simpan"
        isSubmitting={createCustomer.isPending || updateCustomer.isPending}
      />

      <DeleteCustomerModal
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        customerName={deleteTarget?.name ?? null}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteCustomer.isPending}
      />
    </>
  );
}
