import { useState } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import SalesSparepartTable from '@/components/features/sparepart-transaction/SalesSparepartTable';
import DeleteSalesSparepartDialog from '@/components/features/sparepart-transaction/DeleteSalesSparepartDialog';
import { PageHeader } from '@/components/ui/page-header';
import { useSparepartTransactions, useDeleteSparepartTransaction } from '@/hooks/useSparepartTransaction';
import { useRouter } from 'next/router';
import { useCompany } from '@/contexts/CompanyContext';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

export default function SalesSparepartPage() {
  const router = useRouter();
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

  const { data, isLoading, isFetching } = useSparepartTransactions({
    page,
    perPage,
    search,
    type: 'sales',
    company_id: companyId,
    start_date: startDate,
    end_date: endDate,
  });

  const deleteMutation = useDeleteSparepartTransaction();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await deleteMutation.mutateAsync(selectedId);
      toast.success('Data berhasil dihapus');
      setSelectedId(null);
      setPage(1);
    } catch {
      toast.error('Gagal menghapus data');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Penjualan Sparepart"
            breadcrumbs={[
              { label: 'Administrasi' },
              { label: 'Penjualan Sparepart' },
            ]}
          />
          <div className="flex gap-2"></div>
        </div>

        <SalesSparepartTable
          data={data?.data ?? []}
          meta={data?.meta}
          onDelete={(id) => setSelectedId(id)}
          onAdd={canCreate ? () => router.push(`/dashboard/${slug}/transaksi/penjualan-sparepart/create`) : undefined}
          slug={slug as string}
          onPageChange={setPage}
          onPerPageChange={(value) => {
            setPerPage(value);
            setPage(1);
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

        <DeleteSalesSparepartDialog
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
          onConfirm={handleDelete}
          loading={deleteMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
