'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { useTransactions, useTransactionSummary } from '@/hooks/useTransaction';
import { useCompany } from '@/contexts/CompanyContext';
import { TransactionTable } from '@/components/features/transaction/TransactionTable';
import { TransactionSummaryCards } from '@/components/features/transaction/TransactionSummaryCards';
import { DeleteTransactionDialog } from '@/components/features/transaction/DeleteTransactionDialog';
import { Plus } from 'lucide-react';
import { Transaction } from '@/@types/transaction.types';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { LoadingState } from '@/components/ui/loading-state';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';

// This page implements the List view
export default function TransactionListPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { companyId } = useCompany();
  const safeCompanyId = companyId || '1'; // Fallback to "1" for PT Wajira Morindo
  const basePath = slug ? `/dashboard/${slug}/transaksi/arus-transaksi` : '/transaksi/arus-transaksi';

  const { page, perPage, search, setPage, setPerPage, setSearch, updateQuery } = useQueryParamsTable({ defaultPerPage: 25 });
  const [searchInput, setSearchInput] = useState(search);
  const [date, setDate] = useState<DateRange | undefined>();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search, setSearch]);

  const handleDateChange = (next?: DateRange) => {
    setDate(next);
    setPage(1);
  };

  const startDate = date?.from ? date.from.toISOString().split('T')[0] : undefined;
  const endDate = date?.to ? date.to.toISOString().split('T')[0] : undefined;

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('transaction:create');
  const canEdit = hasPermission('transaction:edit');
  const canDelete = hasPermission('transaction:delete');

  // Query Hooks
  const { data, isLoading: isListLoading } = useTransactions(safeCompanyId, page, perPage, search, startDate, endDate);
  const { data: summary, isLoading: isSummaryLoading } = useTransactionSummary(safeCompanyId);

  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / perPage));

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
        {/* HEADLINE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">Arus Transaksi Operasional</h1>
            <p className="text-sm text-muted-foreground">Kelola arus transaksi operasional perusahaan</p>
          </div>
        </div>

        <TransactionSummaryCards
          totalBcaUsd={summary?.totalBcaUsd || 0}
          totalBcaIdr={summary?.totalBcaIdr || 0}
          totalCashIdr={summary?.totalCashIdr || 0}
          isLoading={isSummaryLoading}
        />

        {/* TABLE */}
        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari arus transaksi"
          filters={
            <DatePickerWithRange
              date={date}
              onChange={handleDateChange}
              placeholder="Pilih rentang tanggal transaksi"
              className="w-full sm:w-[260px]"
            />
          }
          page={page}
          perPage={perPage}
          total={total}
          lastPage={lastPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          actions={
            <>
              {search && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchInput('');
                    updateQuery({ search: undefined, page: 1 });
                  }}
                  className="rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer h-9 text-xs px-3"
                >
                  Reset
                </Button>
              )}
              {canCreate && (
                <Button onClick={() => router.push(`${basePath}/create`)} className="btn-primary-orange!">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah
                </Button>
              )}
            </>
          }
        >
          {isListLoading ? (
            <LoadingState variant="page" />
          ) : (
            <TransactionTable data={data?.data || []} onEdit={handleEdit} onDelete={handleDelete} canEdit={canEdit} canDelete={canDelete} />
          )}
        </SearchPagination>

        {/* DELETE DIALOG */}
        <DeleteTransactionDialog open={openDelete} onOpenChange={setOpenDelete} transaction={selectedTrx} companyId={safeCompanyId} />
      </div>
    </DashboardLayout>
  );
}