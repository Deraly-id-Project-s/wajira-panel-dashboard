import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Search, Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { TarifTable } from '@/components/features/tarif/TarifTable';
import { DeleteTarifModal } from '@/components/features/tarif/DeleteTarifModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useTarifs, useDeleteTarif, useCreateTarif } from '@/hooks/useTarif';
import type { Tarif, TarifPayload } from '@/@types/tarif.types';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { TarifFormModal } from '@/components/features/tarif/TarifFormModal';

export default function TarifPage() {
    const router = useRouter();
    const slug = router.query.slug as string;

    const { hasPermission } = usePermissionGuard();
    const canCreate = hasPermission('master-data:create');
    const canEdit = hasPermission('master-data:edit');
    const canDelete = hasPermission('master-data:delete');

    // Table state
    const [searchInput, setSearchInput] = useState('');   // immediate input
    const [search, setSearch] = useState('');              // debounced
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    // Live search debounce — 400ms
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data: tarifData, isLoading } = useTarifs({ page, perPage, search });
    const deleteMutation = useDeleteTarif();
    const createMutation = useCreateTarif();

    // Modals state
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedTarif, setSelectedTarif] = useState<Tarif | null>(null);

    const isCreateOpen = router.asPath.endsWith('/create');

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

    const handleSaveForm = async (data: TarifPayload) => {
        try {
            await createMutation.mutateAsync(data);
            toast.success('Data tarif berhasil ditambahkan');
            router.push(`/dashboard/${slug}/master/tarif`);
        } catch (error: any) {
            toast.error(error.message || 'Gagal menyimpan data tarif');
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
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="relative w-full sm:w-[300px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search here"
                                    className="pl-9 bg-white"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
                                <span>Show</span>
                                <Select value={perPage.toString()} onValueChange={(val) => { setPerPage(Number(val)); setPage(1); }}>
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
                                <Button onClick={handleAddClick} className="button-theme-1!">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambah Data
                                </Button>
                            )}
                        </div>
                    </div>

                    <TarifTable
                        data={tarifList}
                        meta={tarifData?.meta}
                        page={page}
                        perPage={perPage}
                        isLoading={isLoading}
                        onPageChange={setPage}
                        onPerPageChange={setPerPage}
                        onEdit={handleEditClick}
                        onVersioning={handleVersioningClick}
                        onDelete={handleDeleteClick}
                        canEdit={canEdit}
                        canDelete={canDelete}
                    />
                </div>
            </div>

            <DeleteTarifModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                isDeleting={deleteMutation.isPending}
            />

            <TarifFormModal
                isOpen={isCreateOpen}
                onClose={() => router.push(`/dashboard/${slug}/master/tarif`)}
                onSave={handleSaveForm}
                isSubmitting={createMutation.isPending}
            />
        </DashboardLayout>
    );
}
