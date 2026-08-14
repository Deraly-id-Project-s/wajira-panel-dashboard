import { LoadingState } from '@/components/ui/loading-state';
import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import PengeluaranSparepartTable from '@/components/features/pengeluaran-sparepart/PengeluaranSparepartTable';
import { useWarehouseActivities } from '@/hooks/useWarehouseActivity';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useCompany } from '@/contexts/CompanyContext';

export default function PengeluaranSparepartPage() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const { companyId } = useCompany();

  const { data: activities, isLoading, isError, error, isFetching } = useWarehouseActivities({
    activityType: 'issue',
    type: 'sparepart',
    page: currentPage,
    perPage,
    search: search || undefined,
    start_date: startDate,
    end_date: endDate,
    company_id: companyId ? Number(companyId) : null,
  });

  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('warehouse:edit') || hasPermission('warehouse:activity');

  const data = activities?.data ?? [];
  const meta = activities?.meta ?? {
    currentPage,
    perPage,
    lastPage: 1,
    total: 0,
  };

  const apiErrorMessage = useMemo(() => {
    if (!isError) return '';
    const err = error as { message?: string } | null;
    return err?.message || 'Gagal memuat data pengeluaran sparepart';
  }, [error, isError]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Pengeluaran Sparepart" subtitle="Kelola dan lacak semua data pengeluaran stock sparepart" />

        <div className="space-y-4">
          {isLoading ? (
            <LoadingState variant="page" />
          ) : isError ? (
            <div className="bg-white rounded-md border p-8 text-center text-red-500">{apiErrorMessage}</div>
          ) : (
            <PengeluaranSparepartTable
              data={data}
              meta={meta}
              isLoading={isLoading || isFetching}
              search={search}
              onSearchChange={(v) => {
                setSearch(v);
                setCurrentPage(1);
              }}
              perPage={perPage}
              onPerPageChange={(pp) => {
                setPerPage(pp);
                setCurrentPage(1);
              }}
              canEdit={canEdit}
              onPageChange={setCurrentPage}
              startDate={startDate}
              endDate={endDate}
              onDateRangeChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
