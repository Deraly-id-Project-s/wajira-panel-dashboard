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

export default function PenerimaanUnitPage() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [openForm, setOpenForm] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const { companyId } = useCompany();

  const { data: activities, isLoading, isError, error, isFetching } = useWarehouseActivities({
    activityType: 'receipt',
    type: 'unit-type',
    page: currentPage,
    perPage,
    search: search || undefined,
    start_date: startDate,
    end_date: endDate,
    company_id: companyId ? Number(companyId) : null,
  });

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('warehouse:create');
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
          {isLoading ? (
            <LoadingState variant="page" />
          ) : isError ? (
            <div className="bg-white rounded-md border p-8 text-center text-red-500">{apiErrorMessage}</div>
          ) : (
            <PenerimaanUnitTable
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
              canCreate={canCreate}
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

        <PenerimaanUnitFormDialog open={openForm} onClose={() => setOpenForm(false)} />
      </div>
    </DashboardLayout>
  );
}
