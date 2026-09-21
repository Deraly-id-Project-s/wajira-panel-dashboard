import { useMemo, useState, useEffect } from 'react';
import Head from 'next/head';
import type { RefundTransactionType } from '@/@types/finance-refund.types';
import FinanceRefundTable from '@/components/features/finance-refund/FinanceRefundTable';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { useFinanceRefundList } from '@/hooks/useFinanceRefund';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

interface FinanceRefundPageProps {
  title: string;
  description: string;
  transactionType: RefundTransactionType;
}

export function FinanceRefundPage({ title, description, transactionType }: FinanceRefundPageProps) {
  const { page, perPage, search, getParam, updateQuery, setPage, setPerPage, setSearch } = useQueryParamsTable({
    defaultPage: 1,
    defaultPerPage: 25,
  });
  const status = getParam('status', 'all') as 'all' | 'waiting' | 'approve' | 'reject';
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [searchInput, search, setSearch]);

  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('finance:edit');
  const canDelete = hasPermission('finance:delete');

  const refundQuery = useFinanceRefundList({
    page,
    per_page: perPage,
    search: search || undefined,
    status,
    transactionType,
  });

  const data = useMemo(() => refundQuery.data?.data ?? [], [refundQuery.data?.data]);

  return (
    <DashboardLayout>
      <Head>
        <title>{title} - Wajira Dashboard</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
          <p className="text-sm text-slate-500">{description}</p>
        </div>

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari refund"
          page={page}
          perPage={perPage}
          total={refundQuery.data?.meta.total}
          lastPage={refundQuery.data?.meta.lastPage}
          from={refundQuery.data?.meta.from}
          to={refundQuery.data?.meta.to}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          actions={search ? (
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
          ) : null}
        >
          <FinanceRefundTable
            data={data}
            canEdit={canEdit}
            canDelete={canDelete}
            isLoading={refundQuery.isLoading}
            transactionType={transactionType}
          />
        </SearchPagination>
      </div>
    </DashboardLayout>
  );
}
