'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import PengeluaranUnitTable from '@/components/features/pengeluaran-unit/PengeluaranUnitTable';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { useWarehouseActivities } from '@/hooks/useWarehouseActivity';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { LoadingState } from '@/components/ui/loading-state';
import { useCompany } from '@/contexts/CompanyContext';
import { SearchPagination } from '@/components/ui/search-pagination';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';

export default function PengeluaranUnitPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('warehouse:edit');
  const canDelete = hasPermission('warehouse:delete');

  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 25 });
  const [searchInput, setSearchInput] = useState(search);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [searchInput, search, setSearch]);

  const { data, isLoading, isError, error, refetch, isFetching } = useWarehouseActivities({
    activityType: 'issue',
    type: 'unit-type',
    page,
    perPage,
    search: search || undefined,
    start_date: startDate,
    end_date: endDate,
    company_id: companyId ? Number(companyId) : null,
  });

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

  const errorMessage = useMemo(() => {
    if (!error || typeof error !== 'object' || !('message' in error)) {
      return 'Gagal memuat data pengeluaran unit';
    }

    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' && message.trim().length > 0 ? message : 'Gagal memuat data pengeluaran unit';
  }, [error]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Data Pengeluaran Unit"
          subtitle="Kelola dan lacak semua data pengeluaran stock unit"
        />

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari pengeluaran unit"
          page={page}
          perPage={perPage}
          total={data?.meta?.total}
          lastPage={data?.meta?.lastPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          filters={(
            <DatePickerWithRange
              date={dateRange}
              onChange={handleDateRangeChange}
              className="w-full sm:w-[260px]"
            />
          )}
        >
          {isError ? (
            <div className="flex flex-col items-center justify-center gap-3 bg-white rounded-md border border-red-200 p-8 text-center text-red-500">
              <p>{errorMessage}</p>
              <button
                onClick={() => refetch().catch(() => undefined)}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <PengeluaranUnitTable
              data={data?.data ?? []}
              isLoading={isLoading || isFetching}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          )}
        </SearchPagination>
      </div>
    </DashboardLayout>
  );
}
