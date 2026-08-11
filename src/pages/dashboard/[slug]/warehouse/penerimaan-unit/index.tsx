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

  const { data: activities, isLoading, isError, error } = useWarehouseActivities({
    activityType: 'receipt',
    company_id: companyId ? Number(companyId) : null,
    perPage: 25,
  });

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('warehouse:create');
  const canEdit = hasPermission('warehouse:edit') || hasPermission('warehouse:activity');

  const allData = useMemo(() => activities?.data ?? [], [activities?.data]);

  const filteredData = useMemo(() => {
    let result = allData;
    if (startDate) {
      const start = new Date(startDate);
      // Set to midnight
      start.setHours(0, 0, 0, 0);
      result = result.filter(item => {
        if (!item.tanggal) return false;
        const itemDate = new Date(item.tanggal);
        return itemDate >= start;
      });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(item => {
        if (!item.tanggal) return false;
        const itemDate = new Date(item.tanggal);
        return itemDate <= end;
      });
    }
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter((item) => {
        const matchNo = item.noPenerimaan?.toLowerCase().includes(lowerSearch);
        const matchSupplier = item.supplier?.toLowerCase().includes(lowerSearch);
        const matchKet = item.keterangan?.toLowerCase().includes(lowerSearch);
        const matchDate = item.tanggal?.toLowerCase().includes(lowerSearch);
        return matchNo || matchSupplier || matchKet || matchDate;
      });
    }
    return result;
  }, [allData, search, startDate, endDate]);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalItems);
  const data = filteredData.slice(startIndex, endIndex);

  const meta = {
    currentPage: safeCurrentPage,
    perPage,
    lastPage: totalPages,
    total: totalItems,
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
              isLoading={isLoading}
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
            // headerActions={
            //   canCreate && (
            //     <Button onClick={() => setOpenForm(true)} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
            //       <Plus className="h-4 w-4 mr-2" />
            //       Tambah Data Penerimaan Unit
            //     </Button>
            //   )
            // }
            />
          )}
        </div>

        <PenerimaanUnitFormDialog open={openForm} onClose={() => setOpenForm(false)} />
      </div>
    </DashboardLayout>
  );
}
