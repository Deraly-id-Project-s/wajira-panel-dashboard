'use client';
import { LoadingState } from '@/components/ui/loading-state';

import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import PenerimaanUnitTable from '@/components/features/penerimaan-unit/PenerimaanUnitTable';
import PenerimaanUnitFormDialog from '@/components/features/penerimaan-unit/PenerimaanUnitFormDialog';
import { useWarehouseActivities } from '@/hooks/useWarehouseActivity';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { PageHeader } from '@/components/ui/page-header';
import { useCompany } from '@/contexts/CompanyContext';
import { SearchPagination } from '@/components/ui/search-pagination';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';

export default function PenerimaanUnitPage() {
  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 25 });
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);

  const { companyId } = useCompany();

  const { data: activities, isLoading, isError, error, isFetching } = useWarehouseActivities({
    activityType: 'receipt',
    type: 'unit-type',
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
    return err?.message || 'Gagal memuat data penerimaan unit';
  }, [error, isError]);

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
          title="Penerimaan Unit"
          subtitle="Kelola dan lacak semua data penerimaan stock unit"
        />

        <div className="space-y-4">
          {isError ? (
            <div className="bg-white rounded-md border p-8 text-center text-red-500">{apiErrorMessage}</div>
          ) : (
            <SearchPagination
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search here"
              searchAriaLabel="Cari penerimaan unit"
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
              <PenerimaanUnitTable
                data={data}
                isLoading={isLoading || isFetching}
                canEdit={canEdit}
              />
            </SearchPagination>
          )}
        </div>

        <PenerimaanUnitFormDialog open={openForm} onClose={() => setOpenForm(false)} />
      </div>
    </DashboardLayout>
  );
}
