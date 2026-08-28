import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Search, Plus, Upload } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DriverTable } from '@/components/features/driver/DriverTable';
import { DeleteDriverModal } from '@/components/features/driver/DeleteDriverModal';
import { ImportDriverModal } from '@/components/features/driver/ImportDriverModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
    useDrivers,
    useDeleteDriver,
    useImportDriver,
    useExportDriver,
} from '@/hooks/useDriver';
import { useCompany } from '@/contexts/CompanyContext';
import type { Driver } from '@/@types/driver.types';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

export default function DriverPage() {
    const { companyId: localCompanyId } = useCompany();
    const router = useRouter();
    const slug = router.query.slug as string;
    const { hasPermission } = usePermissionGuard();
    const canCreate = hasPermission('master-data:create');
    const canEdit = hasPermission('master-data:edit');
    const canDelete = hasPermission('master-data:delete');

    // Table state
    const [searchInput, setSearchInput] = useState('');   // immediate display value
    const [search, setSearch] = useState('');              // debounced (sent to API)
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

    // Data & mutations
    const { data: driversData, isLoading } = useDrivers({ page, perPage, search, company_id: localCompanyId ?? undefined });
    const deleteMutation = useDeleteDriver();
    const importMutation = useImportDriver();
    const exportMutation = useExportDriver();

    // Modals state
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleAddClick = () => {
        if (!canCreate) return;
        void router.push(`/dashboard/${slug}/master/driver/create`);
    };

    const handleEditClick = (driver: Driver) => {
        if (!canEdit) return;
        void router.push(`/dashboard/${slug}/master/driver/${driver.id}/edit`);
    };

    const handleViewClick = (driver: Driver) => {
        void router.push(`/dashboard/${slug}/master/driver/${driver.id}`);
    };

    const handleDeleteClick = (driver: Driver) => {
        if (!canDelete) return;
        setSelectedDriver(driver);
        setIsDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!canDelete) return;
        if (!selectedDriver) return;
        try {
            await deleteMutation.mutateAsync(selectedDriver.id);
            toast.success('Data driver berhasil dihapus');
            setIsDeleteOpen(false);
            setSelectedDriver(null);
        } catch (error: any) {
            toast.error(error.message || 'Gagal menghapus data driver');
        }
    };

    const handleImport = async (file: File) => {
        if (!canCreate) return;
        if (!localCompanyId) {
            toast.error('Company belum dipilih');
            return;
        }

        const companyId = localCompanyId;
        try {
            await importMutation.mutateAsync({ id: companyId, file });
            toast.success('Import data driver berhasil');
            setIsImportOpen(false);
        } catch (error: any) {
            toast.error(error.message || 'Import data driver gagal');
        }
    };

    const handleExport = async () => {
        try {
            if (!localCompanyId) {
                toast.error('Company belum dipilih');
                return;
            }

            await exportMutation.mutateAsync(localCompanyId);
            toast.success('Berhasil export data driver');
        } catch (error: any) {
            toast.error(error.message || 'Gagal export data driver');
        }
    };

    const driverList = driversData?.data || [];
    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <PageHeader
                    title="Driver"
                    subtitle="Kelola data driver dengan mudah"
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
                                <Select value={perPage.toString()} onValueChange={(val) => { setPerPage(Number(val)); }}>
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
                                    <Button onClick={() => setIsImportOpen(true)} variant="outline" className="w-full sm:w-auto">
                                        <Upload className="h-4 w-4 mr-2" />
                                        Import
                                    </Button>
                                    <Button onClick={handleExport} disabled={exportMutation.isPending} variant="outline" className="w-full sm:w-auto">
                                        <Upload className="h-4 w-4 mr-2" />
                                        {exportMutation.isPending ? 'Exporting...' : 'Export'}
                                    </Button>
                                    <Button onClick={handleAddClick} className="btn-primary-orange!">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Tambah Data
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <DriverTable
                        data={driverList}
                        meta={driversData?.meta}
                        page={page}
                        perPage={perPage}
                        isLoading={isLoading}
                        onPageChange={setPage}
                        onPerPageChange={setPerPage}
                        onView={handleViewClick}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        canEdit={canEdit}
                        canDelete={canDelete}
                    />
                </div>
            </div>

            {/* Modals */}
            <DeleteDriverModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                isDeleting={deleteMutation.isPending}
            />

            <ImportDriverModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onImport={handleImport}
                isUploading={importMutation.isPending}
            />
        </DashboardLayout>
    );
}
