'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import PurchaseTable from '@/components/features/unit-transaksi/purchase/PurchaseTable';
import DeleteUnitTransactionDialog from '@/components/features/unit-transaksi/DeleteUnitTransactionDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { useDeletePurchase } from '@/hooks/usePurchase';
import { useUnitTransactions } from '@/hooks/useUnitTransaction';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useCompany } from '@/contexts/CompanyContext';
import { companyQueryKeys } from '@/lib/query/company-key';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

export default function PurchasePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const { slug } = router.query;

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('transaction:create');
  const canEdit = hasPermission('transaction:edit');
  const canDelete = hasPermission('transaction:delete');

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useUnitTransactions({
    page,
    perPage,
    search,
    start_date: startDate,
    end_date: endDate,
  });
  const deleteMutation = useDeletePurchase();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await deleteMutation.mutateAsync(selectedId);
      if (companyId) {
        await queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
      } else {
        await queryClient.invalidateQueries({ queryKey: ['unit-transactions'] });
      }
      toast.success('Data berhasil dihapus');
      setSelectedId(null);
      // Refresh list after deletion
      setPage(1);
    } catch {
      toast.error('Gagal menghapus data');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader title="Pembelian Unit" description="Kelola dan lacak semua pembelian unit" />
          <div className="flex gap-2"></div>
        </div>

        <PurchaseTable
          data={data?.data ?? []}
          meta={data?.meta}
          onDelete={(id) => setSelectedId(id)}
          onAdd={canCreate ? () => router.push(`/dashboard/${slug}/transaksi/pembelian-unit/create`) : undefined}
          slug={slug as string}
          onPageChange={setPage}
          onPerPageChange={(value) => {
            setPerPage(value);
          }}
          canEdit={canEdit}
          canCreate={canCreate}
          canDelete={canDelete}
          loading={isLoading || isFetching}
          search={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
            setPage(1);
          }}
        />

        <DeleteUnitTransactionDialog open={!!selectedId} onClose={() => setSelectedId(null)} onConfirm={handleDelete} loading={deleteMutation.isPending} />
      </div>
    </DashboardLayout>
  );
}
