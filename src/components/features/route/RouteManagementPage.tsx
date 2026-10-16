import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SearchPagination } from '@/components/ui/search-pagination';
import { RouteTable } from '@/components/features/route/RouteTable';
import { RouteFormModal } from '@/components/features/route/RouteFormModal';
import { DeleteRouteModal } from '@/components/features/route/DeleteRouteModal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRoutes, useCreateRoute, useUpdateRoute, useDeleteRoute } from '@/hooks/useRoute';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import type { RouteModel, CreateRoutePayload } from '@/@types/route.types';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { ApiValidationError } from '@/lib/api/response';

export function RouteManagementPage() {
    const { hasPermission } = usePermissionGuard();
    const canCreate = hasPermission('master-data:create');
    const canEdit = hasPermission('master-data:edit');
    const canDelete = hasPermission('master-data:delete');

    const { page, perPage, search, setPage, setPerPage, setSearch, updateQuery } = useQueryParamsTable({ defaultPerPage: 25 });
    const [searchInput, setSearchInput] = useState(search);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== searchInput.trim()) {
                setSearch(searchInput.trim());
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput, search, setSearch]);

    const { data: routeData, isLoading } = useRoutes({ page, perPage, search });
    const createMutation = useCreateRoute();
    const updateMutation = useUpdateRoute();
    const deleteMutation = useDeleteRoute();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState<RouteModel | null>(null);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<RouteModel | null>(null);

    const handleAddClick = () => {
        if (!canCreate) return;
        setSelectedRoute(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (route: RouteModel) => {
        if (!canEdit) return;
        setSelectedRoute(route);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (route: RouteModel) => {
        if (!canDelete) return;
        setDeleteTarget(route);
        setIsDeleteOpen(true);
    };

    const handleFormSubmit = async (payload: CreateRoutePayload) => {
        try {
            if (selectedRoute) {
                await updateMutation.mutateAsync({ id: selectedRoute.id, data: payload });
                toast.success('Data rute berhasil diperbarui');
            } else {
                await createMutation.mutateAsync(payload);
                toast.success('Data rute berhasil ditambahkan');
            }
            setIsFormOpen(false);
            setSelectedRoute(null);
        } catch (error: any) {
            if (error instanceof ApiValidationError) {
                toast.error(error.message || 'Validasi gagal');
                return;
            }
            toast.error(error?.message || 'Gagal menyimpan data rute');
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            toast.success('Data rute berhasil dihapus');
            setIsDeleteOpen(false);
            setDeleteTarget(null);
        } catch (error: any) {
            toast.error(error?.message || 'Gagal menghapus data rute');
        }
    };

    const routeList = routeData?.data || [];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Master Rute"
                subtitle="Kelola titik dan lokasi rute logistik armada"
            />

            <div className="space-y-4">
                <SearchPagination
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    searchPlaceholder="Cari rute, alamat, atau informasi..."
                    searchAriaLabel="Cari rute"
                    page={page}
                    perPage={perPage}
                    total={routeData?.meta?.total ?? 0}
                    lastPage={routeData?.meta?.lastPage ?? 1}
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
                                    Tambah Rute
                                </Button>
                            )}
                        </>
                    }
                >
                    <RouteTable
                        data={routeList}
                        isLoading={isLoading}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        canEdit={canEdit}
                        canDelete={canDelete}
                    />
                </SearchPagination>
            </div>

            <RouteFormModal
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                initialData={selectedRoute}
                onSubmit={handleFormSubmit}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
            />

            <DeleteRouteModal
                isOpen={isDeleteOpen}
                onClose={() => {
                    setIsDeleteOpen(false);
                    setDeleteTarget(null);
                }}
                onConfirm={handleConfirmDelete}
                routeName={deleteTarget?.name}
                isDeleting={deleteMutation.isPending}
            />
        </div>
    );
}
