import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { DateRange } from 'react-day-picker';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { SearchPagination } from '@/components/ui/search-pagination';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import PenerimaanPiutangTable from '@/components/features/penerimaan-piutang/PenerimaanPiutangTable';
import { useDeletePenerimaanPiutang, usePenerimaanPiutang } from '@/hooks/usePenerimaanPiutang';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import type { PenerimaanPiutang } from '@/@types/penerimaan-piutang.types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { LoadingState } from '@/components/ui/loading-state';

export default function DataPenerimaanPiutangPage() {
    const { hasPermission } = usePermissionGuard();
    const canCreate = hasPermission('finance:create');
    const canEdit = hasPermission('finance:edit');
    const canDelete = hasPermission('finance:delete');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [date, setDate] = useState<DateRange | undefined>();
    const [selectedItem, setSelectedItem] = useState<PenerimaanPiutang | null>(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(timeout);
    }, [search]);

    const handleDateChange = (next?: DateRange) => {
        setDate(next);
        setCurrentPage(1);
    };

    const query = usePenerimaanPiutang({
        page: currentPage,
        perPage,
        search: debouncedSearch || undefined,
        start_date: date?.from ? date.from.toISOString().split('T')[0] : undefined,
        end_date: date?.to ? date.to.toISOString().split('T')[0] : undefined,
    });

    const deleteMutation = useDeletePenerimaanPiutang();

    const handleDelete = async () => {
        if (!selectedItem) return;

        try {
            await deleteMutation.mutateAsync(selectedItem.id);
            toast.success('Data penerimaan berhasil dihapus');
            setSelectedItem(null);
        } catch (error: any) {
            toast.error(error?.message ?? 'Gagal menghapus data');
        }
    };

    const errorMessage = query.error instanceof Error ? query.error.message : query.error ? 'Gagal mengambil data penerimaan piutang' : null;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Data Penerimaan Piutang"
                    subtitle="Kelola data penerimaan piutang"
                    actions={
                        query.isFetching ? (
                            <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                                <LoadingState variant="inline" text={null} />
                                Memuat data...
                            </span>
                        ) : null
                    }
                />

                <SearchPagination
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search here"
                    searchAriaLabel="Cari data penerimaan piutang"
                    filters={
                        <DatePickerWithRange
                            date={date}
                            onChange={handleDateChange}
                            placeholder="Pilih rentang tanggal"
                            className="w-full sm:w-[260px]"
                        />
                    }
                    page={currentPage}
                    perPage={perPage}
                    total={query.data?.meta.total ?? 0}
                    lastPage={query.data?.meta.lastPage ?? 1}
                    onPageChange={setCurrentPage}
                    onPerPageChange={(value) => {
                        setPerPage(value);
                        setCurrentPage(1);
                    }}
                >
                    <PenerimaanPiutangTable
                        data={query.data?.data ?? []}
                        meta={query.data?.meta ?? null}
                        loading={query.isLoading || query.isFetching}
                        error={errorMessage}
                        onDelete={(item) => setSelectedItem(item)}
                        onRetry={() => query.refetch()}
                    />
                </SearchPagination>
            </div>

            <AlertDialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Penerimaan?</AlertDialogTitle>
                        <AlertDialogDescription>Data penerimaan piutang akan dihapus dan tidak dapat dikembalikan.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-orange-600 hover:bg-orange-700" disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? (
                                <span className="inline-flex items-center gap-2">
                                    <LoadingState variant="inline" text={null} />
                                    Menghapus
                                </span>
                            ) : (
                                'Hapus'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}