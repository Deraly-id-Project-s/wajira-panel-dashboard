import { useMemo } from 'react';
import Head from 'next/head';
import { Search } from 'lucide-react';
import type { RefundTransactionType } from '@/types/finance-refund.types';
import FinanceRefundTable from '@/components/features/finance-refund/FinanceRefundTable';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
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
  const debouncedSearch = useDebouncedValue(search, 400);

  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('finance:edit');
  const canDelete = hasPermission('finance:delete');

  const refundQuery = useFinanceRefundList({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
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
        <PageHeader title={title} subtitle={description} />

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search here"
                  className="pl-9 bg-white"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
                <span>Show</span>
                <Select value={String(perPage)} onValueChange={(value) => setPerPage(Number(value))}>
                  <SelectTrigger className="w-[70px] bg-white cursor-pointer">
                    <SelectValue placeholder="25" />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>Page</span>
              </div>
            </div>

            {search ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQuery({ search: undefined, page: 1 })}
                className="rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer h-9 text-xs px-3"
              >
                Reset
              </Button>
            ) : null}
          </div>

          <FinanceRefundTable
            data={data}
            meta={refundQuery.data?.meta}
            page={page}
            canEdit={canEdit}
            canDelete={canDelete}
            isLoading={refundQuery.isLoading}
            transactionType={transactionType}
            onPageChange={setPage}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
