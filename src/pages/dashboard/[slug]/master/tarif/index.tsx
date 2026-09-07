import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { SearchPagination } from '@/components/ui/search-pagination';
import { TarifTable } from '@/components/features/tarif/TarifTable';
import { DeleteTarifModal } from '@/components/features/tarif/DeleteTarifModal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTarifs, useDeleteTarif } from '@/hooks/useTarif';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import type { Tarif } from '@/@types/tarif.types';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

export default function TarifPage() {
    const router = useRouter();
    const slug = router.query.slug as string;

    const { hasPermission } = usePermissionGuard();
    const canCreate = hasPermission('master-data:create');
    const canEdit = hasPermission('master-data:edit');
    const canDelete = hasPermission('master-data:delete');

    // Table state
    const { page, perPage, search, setPage, setPerPage, setSearch, updateQuery } = useQueryParamsTable({ defaultPerPage: 25 });
    const [searchInput, setSearchInput] = useState(search);

    // Live search debounce — 400ms
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== searchInput.trim()) {
                setSearch(searchInput.trim());
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput, search, setSearch]);

    const { data: tarifData, isLoading } = useTarifs({ page, perPage, search });
    const deleteMutation = useDeleteTarif();

    // Modals state
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedTarif, setSelectedTarif] = useState<Tarif | null>(null);

    // Handlers
    const handleAddClick = () => {
        if (!canCreate) return;
        router.push(`/dashboard/${slug}/master/tarif/create`);
    };

    const handleEditClick = (tarif: Tarif) => {
        if (!canEdit) return;
        router.push(`/dashboard/${slug}/master/tarif/${tarif.id}/edit`);
    };

    const handleVersioningClick = (tarif: Tarif) => {
        router.push(`/dashboard/${slug}/master/tarif/${tarif.id}`);
    };

    const handleDeleteClick = (tarif: Tarif) => {
        if (!canDelete) return;
        setSelectedTarif(tarif);
        setIsDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!canDelete) return;
        if (!selectedTarif) return;
        try {
            await deleteMutation.mutateAsync(selectedTarif.id);
            toast.success('Data tarif berhasil dihapus');
            setIsDeleteOpen(false);
            setSelectedTarif(null);
        } catch (error: any) {
            toast.error(error.message || 'Gagal menghapus data tarif');
        }
    };

    const tarifList = tarifData?.data || [];
    const totalTarifs = tarifData?.meta?.total || 0;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <PageHeader
                    title="Tarif"
                    subtitle="Kelola data tarif dengan mudah"
                />

                {/* Content */}
                <div className="space-y-4">
                    <SearchPagination
                        searchValue={searchInput}
                        onSearchChange={setSearchInput}
                        searchPlaceholder="Search here"
                        searchAriaLabel="Cari tarif"
                        page={page}
                        perPage={perPage}
                        total={tarifData?.meta?.total ?? 0}
                        lastPage={tarifData?.meta?.lastPage ?? 1}
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
                                {canCreate && (
                                    <Button onClick={handleAddClick} className="btn-primary-orange!">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Tambah Data
                                    </Button>
                                )}
                            </>
                        }
                    >
                        <TarifTable
                            data={tarifList}
                            isLoading={isLoading}
                            onEdit={handleEditClick}
                            onVersioning={handleVersioningClick}
                            onDelete={handleDeleteClick}
                            canEdit={canEdit}
                            canDelete={canDelete}
                        />
                    </SearchPagination>
                </div>
            </div>

            <DeleteTarifModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                isDeleting={deleteMutation.isPending}
            />
        </DashboardLayout>
    );
}
