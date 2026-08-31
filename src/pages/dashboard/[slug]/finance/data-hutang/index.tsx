import { useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { SearchPagination } from '@/components/ui/search-pagination';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import DataHutangTable from '@/components/features/data-hutang/DataHutangTable';
import { useDataHutang } from '@/hooks/useDataHutang';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { LoadingState } from '@/components/ui/loading-state';

export default function DataHutangPage() {
    const { hasPermission } = usePermissionGuard();
    const canCreate = hasPermission('finance:create');
    const canEdit = hasPermission('finance:edit');
    const canDelete = hasPermission('finance:delete');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [date, setDate] = useState<DateRange | undefined>();

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

    const query = useDataHutang({
        page: currentPage,
        perPage,
        search: debouncedSearch || undefined,
        start_date: date?.from ? date.from.toISOString().split('T')[0] : undefined,
        end_date: date?.to ? date.to.toISOString().split('T')[0] : undefined,
    });

    const errorMessage = query.error instanceof Error ? query.error.message : query.error ? 'Gagal mengambil data hutang' : null;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Data Hutang"
                    subtitle="Kelola data hutang"
                    actions={
                        query.isFetching ? (
                            <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                                <LoadingState variant="inline" text={null} />
                                Memuat data...
                            </span>
                        ) : null
                    }
                />

                <div className="no-print">
                    <DatePickerWithRange date={date} onChange={handleDateChange} placeholder="Pilih rentang tanggal hutang" />
                </div>

                <SearchPagination
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search here"
                    searchAriaLabel="Cari data hutang"
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
                    <DataHutangTable
                        data={query.data?.data ?? []}
                        meta={query.data?.meta ?? null}
                        loading={query.isLoading || query.isFetching}
                        error={errorMessage}
                        onRetry={() => query.refetch()}
                    />
                </SearchPagination>
            </div>
        </DashboardLayout>
    )
}