import { LoadingState } from '@/components/ui/loading-state';
import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import PenerimaanSparepartTable from '@/components/features/penerimaan-sparepart/PenerimaanSparepartTable';
import { useWarehouseActivities } from '@/hooks/useWarehouseActivity';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useCompany } from '@/contexts/CompanyContext';
import { SearchPagination } from '@/components/ui/search-pagination';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';

export default function PenerimaanSparepartPage() {
  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 25 });
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const { companyId } = useCompany();

  const { data: activities, isLoading, isError, error, isFetching } = useWarehouseActivities({
    activityType: 'receipt',
    type: 'sparepart',
    page,
    perPage,
    search: search || undefined,
    start_date: startDate,
    end_date: endDate,
    company_id: companyId ? Number(companyId) : null,
  });

  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('warehouse:edit') || hasPermission('warehouse:activity');

  const data = activities?.data ?? [];

  const dateRange = useMemo<DateRange | undefined>(() => {
    if (!startDate && !endDate) return undefined;
    return {
      from: startDate ? new Date(startDate) : undefined,
      to: endDate ? new Date(endDate) : undefined,
    };
  }, [startDate, endDate]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    const start = range?.from ? range.from.toISOString().slice(0, 10) : null;
    const end = range?.to ? range.to.toISOString().slice(0, 10) : null;
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  };

  const apiErrorMessage = useMemo(() => {
    if (!isError) return '';
    const err = error as { message?: string } | null;
    return err?.message || 'Gagal memuat data penerimaan sparepart';
  }, [error, isError]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Penerimaan Sparepart" subtitle="Kelola dan lacak semua data penerimaan stock sparepart" />

        <div className="space-y-4">
          {isLoading ? (
            <LoadingState variant="page" />
          ) : isError ? (
            <div className="bg-white rounded-md border p-8 text-center text-red-500">{apiErrorMessage}</div>
          ) : (
            <SearchPagination
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Cari penerimaan..."
              searchAriaLabel="Cari penerimaan sparepart"
              page={page}
              perPage={perPage}
              total={activities?.meta?.total}
              lastPage={activities?.meta?.lastPage}
              onPageChange={setPage}
              onPerPageChange={setPerPage}
              actions={(
                <DatePickerWithRange
                  date={dateRange}
                  onChange={handleDateRangeChange}
                  className="w-auto"
                />
              )}
            >
              <PenerimaanSparepartTable
                data={data}
                isLoading={isLoading || isFetching}
                canEdit={canEdit}
              />
            </SearchPagination>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
