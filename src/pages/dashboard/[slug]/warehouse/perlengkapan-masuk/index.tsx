import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { SearchPagination } from '@/components/ui/search-pagination';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import VehicleEquipmentActivityTable from '@/components/features/vehicle-equipment-warehouse/VehicleEquipmentActivityTable';
import { useCompany } from '@/contexts/CompanyContext';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { useWarehouseActivities } from '@/hooks/useWarehouseActivity';

export default function VehicleEquipmentReceiptPage() {
  const { companyId } = useCompany();
  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 25 });
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const { data, isLoading, isError, error, isFetching } = useWarehouseActivities({
    activityType: 'receipt',
    type: 'vehicle-equipment',
    page,
    perPage,
    search: search || undefined,
    start_date: startDate,
    end_date: endDate,
    company_id: companyId ? Number(companyId) : null,
  });

  const dateRange = useMemo<DateRange | undefined>(() => {
    if (!startDate && !endDate) return undefined;
    return { from: startDate ? new Date(startDate) : undefined, to: endDate ? new Date(endDate) : undefined };
  }, [endDate, startDate]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setStartDate(range?.from ? range.from.toISOString().slice(0, 10) : null);
    setEndDate(range?.to ? range.to.toISOString().slice(0, 10) : null);
    setPage(1);
  };

  const apiErrorMessage = (error as { message?: string } | null)?.message || 'Gagal memuat data penerimaan perlengkapan';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Penerimaan Perlengkapan" subtitle="Kelola aktivitas penerimaan perlengkapan kendaraan" />
        {isLoading ? (
          <LoadingState variant="page" />
        ) : isError ? (
          <div className="rounded-md border bg-white p-8 text-center text-red-500">{apiErrorMessage}</div>
        ) : (
          <SearchPagination
            searchValue={search}
            onSearchChange={(value) => { setSearch(value); setPage(1); }}
            searchPlaceholder="Cari penerimaan perlengkapan..."
            searchAriaLabel="Cari penerimaan perlengkapan"
            page={page}
            perPage={perPage}
            total={data?.meta?.total}
            lastPage={data?.meta?.lastPage}
            onPageChange={setPage}
            onPerPageChange={(value) => { setPerPage(value); setPage(1); }}
            filters={<DatePickerWithRange date={dateRange} onChange={handleDateRangeChange} className="w-full sm:w-[260px]" />}
          >
            <VehicleEquipmentActivityTable data={data?.data ?? []} type="receipt" isLoading={isFetching} />
          </SearchPagination>
        )}
      </div>
    </DashboardLayout>
  );
}
