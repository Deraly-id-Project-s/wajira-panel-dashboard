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

export default function PengeluaranUnitPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('warehouse:edit');
  const canDelete = hasPermission('warehouse:delete');

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

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

  const meta = data?.meta ?? {
    currentPage: page,
    perPage,
    total: 0,
    lastPage: 1,
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

        <PengeluaranUnitTable
          data={data?.data ?? []}
          meta={meta}
          search={searchInput}
          perPage={perPage}
          page={page}
          isLoading={isLoading || isFetching}
          isError={isError}
          errorMessage={errorMessage}
          onSearchChange={setSearchInput}
          onPerPageChange={(value) => {
            setPerPage(value);
          }}
          canEdit={canEdit}
          canDelete={canDelete}
          onPageChange={setPage}
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
            setPage(1);
          }}
          onRetry={() => {
            refetch().catch(() => undefined);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
