'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { DealerTable } from '@/components/features/dealer/DealerTable';
import { DealerFormModal, DealerFormData } from '@/components/features/dealer/DealerFormModal';
import { EditDealerModal } from '@/components/features/dealer/EditDealerModal';
import { DeleteDealerModal } from '@/components/features/dealer/DeleteDealerModal';
import { DealerImportModal } from '@/components/features/dealer/DealerImportModal';
import { toast } from 'sonner';
import { useDealers, useCreateDealer, useUpdateDealer, useDeleteDealer, useExportDealer } from '@/hooks/useDealer';
import { useCompany } from '@/contexts/CompanyContext';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import type { Dealer } from '@/@types/dealer.types';
import { Download, Plus, Upload } from 'lucide-react';

export const DealerListPage = () => {
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

    const { data, isLoading, isFetching, isError } = useDealers(companyId, { page, perPage, search });

    const dealersList = data?.data ?? [];

    const createMutation = useCreateDealer();
    const updateMutation = useUpdateDealer();
    const deleteMutation = useDeleteDealer();
    const exportMutation = useExportDealer();

    // Modals state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [openImport, setOpenImport] = useState(false);
    const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);

    const handleAddClick = () => {
        if (!canCreate) return;
        setSelectedDealer(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (dealer: Dealer) => {
        if (!canEdit) return;
        setSelectedDealer(dealer);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (dealer: Dealer) => {
        if (!canDelete) return;
        setSelectedDealer(dealer);
        setIsDeleteOpen(true);
    };

    const handleSaveForm = async (data: DealerFormData) => {
        try {
            if (selectedDealer) {
                await updateMutation.mutateAsync({ id: selectedDealer.id, data: { ...data, companyId: Number(companyId) } });
                toast.success('Data dealer berhasil diubah');
            } else {
                await createMutation.mutateAsync({ ...data, companyId: Number(companyId) });
                toast.success('Data dealer berhasil ditambahkan');
            }
            setIsFormOpen(false);
        } catch (error: any) {
            toast.error(error.message || 'Gagal menyimpan data');
        }
    };

    const handleConfirmDelete = async () => {
        if (selectedDealer) {
            try {
                await deleteMutation.mutateAsync(selectedDealer.id);
                toast.success('Data dealer berhasil dihapus');
                setIsDeleteOpen(false);
                setSelectedDealer(null);
            } catch (error: any) {
                toast.error(error.message || 'Gagal menghapus data');
            }
        }
    };

    const handleExport = async () => {
        try {
            await exportMutation.mutateAsync(companyId ? Number(companyId) : undefined);
            toast.success('Berhasil export data');
        } catch (error: any) {
            toast.error(error.message || 'Gagal export data');
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Dealer"
                    subtitle="Kelola data dealer"
                />

                <SearchPagination
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    searchPlaceholder="Search here"
                    searchAriaLabel="Cari dealer"
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
                            <Button onClick={handleExport} disabled={exportMutation.isPending} variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                {exportMutation.isPending ? 'Exporting...' : 'Export'}
                            </Button>
                            {canCreate && (
                                <>
                                    <Button onClick={() => setOpenImport(true)} variant="outline" size="sm">
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
                        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-base text-red-600">
                            Gagal memuat data dealer.
                        </div>
                    ) : (
                        <DealerTable
                            dealers={dealersList}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            isLoading={isLoading || isFetching}
                        />
                    )}
                </SearchPagination>
            </div>

            <DealerFormModal
                isOpen={isFormOpen && !selectedDealer}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveForm}
            />

            {selectedDealer && (
                <EditDealerModal
                    isOpen={isFormOpen && !!selectedDealer}
                    onClose={() => {
                        setIsFormOpen(false);
                        setTimeout(() => setSelectedDealer(null), 300);
                    }}
                    onSave={handleSaveForm}
                    initialData={selectedDealer}
                />
            )}

            <DeleteDealerModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
            />

            <DealerImportModal
                open={openImport}
                onOpenChange={setOpenImport}
            />
        </DashboardLayout>
    );
};