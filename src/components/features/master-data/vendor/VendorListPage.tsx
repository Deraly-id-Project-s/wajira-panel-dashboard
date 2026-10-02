'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { VendorTable } from '@/components/features/vendor/VendorTable';
import { VendorFormModal, VendorFormData } from '@/components/features/vendor/VendorFormModal';
import { EditVendorModal } from '@/components/features/vendor/EditVendorModal';
import { DeleteVendorModal } from '@/components/features/vendor/DeleteVendorModal';
import { VendorImportModal } from '@/components/features/vendor/VendorImportModal';
import { toast } from 'sonner';
import { useVendors, useCreateVendor, useUpdateVendor, useDeleteVendor, useExportVendor } from '@/hooks/useVendor';
import { useCompany } from '@/contexts/CompanyContext';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import type { Vendor } from '@/@types/vendor.types';
import { Download, Plus, Upload } from 'lucide-react';

export const VendorListPage = () => {
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

    const { data, isLoading, isFetching, isError } = useVendors({
        page,
        perPage,
        search,
        company_id: companyId ?? undefined,
    });

    const vendorsList = data?.data ?? [];

    const createMutation = useCreateVendor();
    const updateMutation = useUpdateVendor();
    const deleteMutation = useDeleteVendor();
    const exportMutation = useExportVendor();

    // Modals state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [openImport, setOpenImport] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

    const handleAddClick = () => {
        if (!canCreate) return;
        setSelectedVendor(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (vendor: Vendor) => {
        if (!canEdit) return;
        setSelectedVendor(vendor);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (vendor: Vendor) => {
        if (!canDelete) return;
        setSelectedVendor(vendor);
        setIsDeleteOpen(true);
    };

    const handleSaveForm = async (data: VendorFormData) => {
        if (selectedVendor && !canEdit) return;
        if (!selectedVendor && !canCreate) return;
        try {
            if (!companyId) {
                toast.error('Company belum dipilih');
                return;
            }
            const id = companyId;
            if (selectedVendor) {
                await updateMutation.mutateAsync({ id: selectedVendor.id, data: { ...data, companyId: Number(id) } });
                toast.success('Data vendor berhasil diubah');
            } else {
                await createMutation.mutateAsync({ ...data, companyId: Number(id) });
                toast.success('Data vendor berhasil ditambahkan');
            }
            setIsFormOpen(false);
        } catch (error: any) {
            toast.error(error.message || 'Gagal menyimpan data');
        }
    };

    const handleConfirmDelete = async () => {
        if (!canDelete) return;
        if (selectedVendor) {
            try {
                await deleteMutation.mutateAsync(selectedVendor.id);
                toast.success('Data vendor berhasil dihapus');
                setIsDeleteOpen(false);
                setSelectedVendor(null);
            } catch (error: any) {
                toast.error(error.message || 'Gagal menghapus data');
            }
        }
    };

    const handleExport = async () => {
        try {
            if (!companyId) {
                toast.error('Company belum dipilih');
                return;
            }
            await exportMutation.mutateAsync(companyId);
            toast.success('Berhasil export data vendor');
        } catch (error: any) {
            toast.error(error.message || 'Gagal export data vendor');
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Vendor"
                    subtitle="Kelola data vendor"
                />

                <SearchPagination
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    searchPlaceholder="Search here"
                    searchAriaLabel="Cari vendor"
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
                            <Button onClick={handleExport} disabled={exportMutation.isPending} variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                {exportMutation.isPending ? 'Exporting...' : 'Export'}
                            </Button>
                            {canCreate && (
                                <>
                                    <Button onClick={() => setOpenImport(true)} variant="outline">
                                        <Upload className="h-4 w-4 mr-2" />
                                        Import
                                    </Button>
                                    <Button variant="default" onClick={handleAddClick}>
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
                            Gagal memuat data vendor.
                        </div>
                    ) : (
                        <VendorTable
                            vendors={vendorsList}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            isLoading={isLoading || isFetching}
                        />
                    )}
                </SearchPagination>
            </div>

            <VendorFormModal
                isOpen={isFormOpen && !selectedVendor}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveForm}
            />

            {selectedVendor && (
                <EditVendorModal
                    isOpen={isFormOpen && !!selectedVendor}
                    onClose={() => {
                        setIsFormOpen(false);
                        setTimeout(() => setSelectedVendor(null), 300);
                    }}
                    onSave={handleSaveForm}
                    initialData={selectedVendor}
                />
            )}

            <DeleteVendorModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                isDeleting={deleteMutation.isPending}
            />

            <VendorImportModal
                open={openImport}
                onOpenChange={setOpenImport}
            />
        </DashboardLayout>
    );
};