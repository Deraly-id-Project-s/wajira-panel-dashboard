'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useTransactions, useTransactionSummary } from '@/hooks/useTransaction';
import { useCompany } from '@/contexts/CompanyContext';
import { TransactionTable } from '@/components/features/transaction/TransactionTable';
import { TransactionSummaryCards } from '@/components/features/transaction/TransactionSummaryCards';
import { DeleteTransactionDialog } from '@/components/features/transaction/DeleteTransactionDialog';
import { Plus, Search } from 'lucide-react';
import { Transaction } from '@/types/transaction.types';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { LoadingState } from '@/components/ui/loading-state';

// This page implements the List view
export default function TransactionListPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { companyId } = useCompany();
  const safeCompanyId = companyId || '1'; // Fallback to "1" for PT Wajira Morindo
  const basePath = slug ? `/dashboard/${slug}/transaksi/arus-transaksi` : '/transaksi/arus-transaksi';

  // Local State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [localSearch, setLocalSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== debouncedSearch) {
        setDebouncedSearch(localSearch);
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, debouncedSearch]);

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('transaction:create');
  const canEdit = hasPermission('transaction:edit');
  const canDelete = hasPermission('transaction:delete');

  // Query Hooks
  const { data, isLoading: isListLoading } = useTransactions(safeCompanyId, page, limit, debouncedSearch);
  const { data: summary, isLoading: isSummaryLoading } = useTransactionSummary(safeCompanyId);

  // Dialog State
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);

  // Handlers
  const handleEdit = (trx: Transaction) => {
    router.push(`${basePath}/${trx.id}/edit`);
  };

  const handleDelete = (trx: Transaction) => {
    setSelectedTrx(trx);
    setOpenDelete(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Arus Transaksi Operasional"
          subtitle="Kelola arus transaksi operasional perusahaan"
        />

        <TransactionSummaryCards
          totalBcaUsd={summary?.totalBcaUsd || 0}
          totalBcaIdr={summary?.totalBcaIdr || 0}
          totalCashIdr={summary?.totalCashIdr || 0}
          isLoading={isSummaryLoading}
        />

        {/* FILTERS & ACTIONS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search here..." className="pl-9 bg-white" value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 text-sm whitespace-nowrap">
              <span>Show</span>
              <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-9 w-[70px] bg-white">
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

          {canCreate && (
            <Button onClick={() => router.push(`${basePath}/create`)} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
              <Plus className="mr-2 h-4 w-4" />
              Tambah
            </Button>
          )}
        </div>

        {/* TABLE */}
        {isListLoading ? (
          <LoadingState variant="page" />
        ) : (
          <TransactionTable data={data?.data || []} onEdit={handleEdit} onDelete={handleDelete} canEdit={canEdit} canDelete={canDelete} />
        )}

        {/* PAGINATION INFO */}
        {!isListLoading && data && (
          <div className="flex flex-col gap-4 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between px-1">
            <div>
              Showing {(page - 1) * limit + 1}-{Math.min(page * limit, data.total)} of {data.total} data
            </div>
            {data.total > limit && (
              <div className="flex flex-wrap items-center justify-end gap-1 text-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-md px-2 text-sm font-medium hover:bg-transparent disabled:text-slate-300"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 min-w-9 rounded-md border px-3 text-sm font-medium border-slate-200 bg-white text-slate-950 shadow-sm"
                >
                  {page}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-md px-2 text-sm font-medium hover:bg-transparent disabled:text-slate-300"
                  onClick={() => setPage(page + 1)}
                  disabled={page * limit >= data.total}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* DELETE DIALOG */}
        <DeleteTransactionDialog open={openDelete} onOpenChange={setOpenDelete} transaction={selectedTrx} companyId={safeCompanyId} />
      </div>
    </DashboardLayout>
  );
}
