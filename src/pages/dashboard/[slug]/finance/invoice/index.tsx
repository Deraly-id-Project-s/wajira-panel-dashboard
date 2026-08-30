import { useEffect, useState } from 'react';
import Head from 'next/head';
import { Search } from 'lucide-react';
import type { DoInvoice } from '@/@types/create-invoice.types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FinanceInvoiceTable from '@/components/features/finance/invoice/FinanceInvoiceTable';
import FinanceInvoicePaymentModal from '@/components/features/finance/invoice/FinanceInvoicePaymentModal';
import { useCompany } from '@/contexts/CompanyContext';
import { useDoInvoices } from '@/hooks/useDoInvoice';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

export default function FinanceInvoicePage() {
  const { companyId } = useCompany();
  const companyNumber = Number(companyId || 0);
  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('finance:create');
  const canEdit = hasPermission('finance:edit');
  const canDelete = hasPermission('finance:delete');

  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState('created_at');
  const [orderSort, setOrderSort] = useState<'asc' | 'desc'>('desc');
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DoInvoice | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchValue(searchInput.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, isError, error, refetch } = useDoInvoices({
    page,
    perPage: perPage,
    search: searchValue,
    order_by: orderBy,
    order_sort: orderSort,
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePerPageChange = (value: string) => {
    setPerPage(Number(value));
  };

  const handleSortChange = (key: string) => {
    if (orderBy === key) {
      setOrderSort(orderSort === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(key);
      setOrderSort('desc');
    }
    setPage(1);
  };

  const handlePay = (item: DoInvoice) => {
    setSelectedItem(item);
    setIsPaymentModalOpen(true);
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Invoice Terbuat - PT Wajira Transindo</title>
      </Head>

      <div className="space-y-6">
        <PageHeader
          title="Invoice Terbuat"
          subtitle="Kelola invoice ekspedisi dengan mudah"
        />

        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center w-full sm:w-auto">
              <div className="relative w-full sm:w-[320px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search here"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
                <span>Show</span>
                <Select value={String(perPage)} onValueChange={handlePerPageChange}>
                  <SelectTrigger className="w-[70px] bg-white cursor-pointer">
                    <SelectValue />
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
            {/* Export button placeholder matching existing UI patterns */}
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>
              Export
            </Button>
          </div>

          <FinanceInvoiceTable
            data={data?.data ?? []}
            meta={data?.meta ?? null}
            isLoading={isLoading}
            isError={isError}
            errorMessage={error ? 'Terjadi kesalahan saat memuat data.' : undefined}
            onRetry={() => refetch()}
            onPay={handlePay}
            onPageChange={handlePageChange}
            onSortChange={handleSortChange}
            currentSortBy={orderBy}
            currentSortDirection={orderSort}
          />
        </div>

        <FinanceInvoicePaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          item={selectedItem}
          companyId={companyNumber}
        />
      </div>
    </DashboardLayout>
  );
}
