import React, { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Download, Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { FinanceAssetTable } from '@/components/features/finance/asset/FinanceAssetTable';
import { useFinanceAssets, useDeleteFinanceAsset, useExportFinanceAsset } from '@/hooks/useFinanceAsset';
import { useCompany } from '@/contexts/CompanyContext';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DeleteAssetModal } from '@/components/features/master-data/asset/DeleteAssetModal';
import type { FinanceAsset } from '@/@types/finance-asset.types';

export default function FinanceAssetPage() {
    const { companyId } = useCompany();
    const router = useRouter();
    const { slug } = router.query;
    const { hasPermission } = usePermissionGuard();
    const canCreate = hasPermission('finance:create');
    const canEdit = hasPermission('finance:edit');
    const canDelete = hasPermission('finance:delete');

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [date, setDate] = useState<DateRange | undefined>();

    const handleDateChange = (next?: DateRange) => {
        setDate(next);
        setPage(1);
    };

    const startDate = date?.from ? date.from.toISOString().split('T')[0] : undefined;
    const endDate = date?.to ? date.to.toISOString().split('T')[0] : undefined;

    const { data: assetsData, isLoading } = useFinanceAssets(companyId, { page, perPage, search, start_date: startDate, end_date: endDate });
    const deleteMutation = useDeleteFinanceAsset();
    const exportMutation = useExportFinanceAsset();

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<FinanceAsset | null>(null);

    const filteredAssets = useMemo(() => {
        const assets = assetsData?.data || [];
        if (!companyId) return assets;

        return assets.filter((asset) => {
            if (asset.company_id === undefined || asset.company_id === null) {
                return true;
            }

            return String(asset.company_id) === String(companyId);
        });
    }, [assetsData?.data, companyId]);

    const totalAssets = useMemo(() => {
        const apiTotal = assetsData?.meta.total ?? 0;
        const hasCompanyIdOnEveryRow = filteredAssets.every(
            (asset) => asset.company_id !== undefined && asset.company_id !== null,
        );

        return hasCompanyIdOnEveryRow ? filteredAssets.length : apiTotal;
    }, [assetsData?.meta.total, filteredAssets]);

    const lastPage = Math.max(1, Math.ceil(totalAssets / perPage));

    const handleEdit = (asset: FinanceAsset) => {
        router.push(`/dashboard/${slug}/finance/asset/${asset.id}/edit`);
    };

    const handleAdd = () => {
        router.push(`/dashboard/${slug}/finance/asset/create`);
    };

    const handleDetail = (asset: FinanceAsset) => {
        router.push(`/dashboard/${slug}/finance/asset/${asset.id}`);
    };

    const handleDelete = (asset: FinanceAsset) => {
        setSelectedAsset(asset);
        setIsDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedAsset) return;
        try {
            await deleteMutation.mutateAsync(selectedAsset.id);
            toast.success('Data aset berhasil dihapus');
            setIsDeleteOpen(false);
        } catch (error: any) {
            toast.error(error.message || 'Gagal menghapus data');
        }
    };

    const handleExport = async () => {
        try {
            await exportMutation.mutateAsync();
            toast.success('Data aset berhasil diekspor');
        } catch (error: any) {
            toast.error(error.message || 'Gagal mengekspor data');
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Aset"
                    subtitle="Kelola seluruh aset dengan mudah"
                />

                <SearchPagination
                    searchValue={search}
                    onSearchChange={(value) => {
                        setSearch(value);
                        setPage(1);
                    }}
                    searchPlaceholder="Search here"
                    searchAriaLabel="Cari data aset"
                    filters={
                        <DatePickerWithRange
                            date={date}
                            onChange={handleDateChange}
                            placeholder="Pilih rentang tanggal"
                            className="w-full sm:w-[260px]"
                        />
                    }
                    page={page}
                    perPage={perPage}
                    total={totalAssets}
                    lastPage={lastPage}
                    onPageChange={setPage}
                    onPerPageChange={(value) => {
                        setPerPage(value);
                        setPage(1);
                    }}
                    actions={
                        <>
                            <Button onClick={handleExport} disabled={exportMutation.isPending} variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                {exportMutation.isPending ? 'Exporting...' : 'Export'}
                            </Button>
                            {canCreate && (
                                <Button onClick={handleAdd} className="btn-primary!">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambah
                                </Button>
                            )}
                        </>
                    }
                >
                    <FinanceAssetTable
                        assets={filteredAssets}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onDetail={handleDetail}
                        isLoading={isLoading}
                    />
                </SearchPagination>
            </div>

            <DeleteAssetModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                isDeleting={deleteMutation.isPending}
            />
        </DashboardLayout>
    );
}