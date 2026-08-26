import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompany } from '@/contexts/CompanyContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { getVisiblePageNumbers } from '@/lib/api/pagination';
import { cn } from '@/lib/utils';
import { useMaintenance } from '@/hooks/warehouse/useMaintenance';
import { MaintenanceTable } from '@/components/features/warehouse/maintenance/MaintenanceTable';
import { MaintenanceDetailModal } from '@/components/features/warehouse/maintenance/MaintenanceDetailModal';
import type { MaintenanceItem } from '@/types/maintenance.types';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

export default function MaintenanceListPage() {
  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('warehouse:create');
  const canEdit = hasPermission('warehouse:edit');
  const canDelete = hasPermission('warehouse:delete');

  const { isLoading: isCompanyLoading } = useCompany();

  // PT Wajira Transindo company ID is 4
  const activeCompanyId = 4;

  const { page, perPage, search, setPage, setPerPage, updateQuery } = useQueryParamsTable({ defaultPerPage: 25 });
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  // Sync search input when search query param changes
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Update URL params when debounced search input changes
  useEffect(() => {
    if (!isCompanyLoading && debouncedSearch !== search) {
      updateQuery({ search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, isCompanyLoading, search, updateQuery]);

  const maintenanceQuery = useMaintenance(
    {
      company_id: activeCompanyId,
      search: search || undefined,
      page,
      per_page: perPage,
    },
    {
      enabled: !isCompanyLoading,
    }
  );

  // Modal State
  const [selectedItem, setSelectedItem] = useState<MaintenanceItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const transactions = maintenanceQuery.data?.data ?? [];
  const meta = maintenanceQuery.data?.meta;
  const totalData = meta?.total ?? 0;
  const totalPages = meta?.lastPage ?? 1;
  const startData = totalData === 0 ? 0 : (page - 1) * perPage + 1;
  const endData = Math.min(page * perPage, totalData);
  const pageNumbers = useMemo(() => getVisiblePageNumbers(totalPages, page, 5), [page, totalPages]);

  const handleViewDetail = (item: MaintenanceItem) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  const renderPagination = () => {
    const showLastPage = totalPages > 5 && !pageNumbers.includes(totalPages);

    return (
      <div className="flex flex-wrap items-center justify-end gap-1 text-slate-800">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 rounded-md px-2 text-sm font-medium hover:bg-transparent disabled:text-slate-300"
          disabled={page <= 1 || maintenanceQuery.isLoading}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>
        {pageNumbers.map((pageNumber) => (
          <Button
            key={pageNumber}
            variant="ghost"
            size="sm"
            className={cn(
              'h-9 min-w-9 rounded-md border px-3 text-sm font-medium shadow-none',
              pageNumber === page
                ? 'border-slate-200 bg-white text-slate-950 shadow-sm'
                : 'border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white',
            )}
            disabled={maintenanceQuery.isLoading}
            onClick={() => setPage(pageNumber)}
          >
            {pageNumber}
          </Button>
        ))}
        {showLastPage && <span className="px-1 text-slate-500">...</span>}
        {showLastPage && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 min-w-9 rounded-md border border-transparent bg-transparent px-3 text-sm font-medium text-slate-700 hover:border-slate-200 hover:bg-white"
            disabled={maintenanceQuery.isLoading}
            onClick={() => setPage(totalPages)}
          >
            {totalPages}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 rounded-md px-2 text-sm font-medium hover:bg-transparent disabled:text-slate-300"
          disabled={page >= totalPages || totalData === 0 || maintenanceQuery.isLoading}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Maintenance - Wajira Dashboard</title>
      </Head>

      <div className="space-y-6">
        <PageHeader
          title="Data Maintenance"
          subtitle="Kelola dan lacak semua armada yang membutuhkan maintenance"
        />

        <div className="space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search here"
                  className="pl-9 bg-white"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
                <span>Show</span>
                <Select value={String(perPage)} onValueChange={(value) => setPerPage(Number(value))}>
                  <SelectTrigger className="w-[70px] bg-white">
                    <SelectValue placeholder="25" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span>Page</span>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="rounded-md border border-gray-200 bg-white overflow-hidden shadow-none">
            <div className="overflow-x-auto">
              <MaintenanceTable
                data={transactions}
                isLoading={maintenanceQuery.isLoading}
                onViewDetail={handleViewDetail}
                startIndex={startData}
              />
            </div>
          </div>

          {/* Pagination Info & Controls */}
          <div className="flex flex-col gap-4 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between">
            <p>
              Showing {startData}-{endData} of {totalData} data
            </p>
            {renderPagination()}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <MaintenanceDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        data={selectedItem}
      />
    </DashboardLayout>
  );
}
