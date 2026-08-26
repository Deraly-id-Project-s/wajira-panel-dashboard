import { useEffect, useState } from 'react';
import Head from 'next/head';
import { Search } from 'lucide-react';
import type { UJDriverItem } from '@/types/uj-driver.types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UJDriverTable from '@/components/features/finance/uj-driver/UJDriverTable';
import UJDriverPaymentModal from '@/components/features/finance/uj-driver/UJDriverPaymentModal';
import { useCompany } from '@/contexts/CompanyContext';
import { useUJDriverList } from '@/hooks/finance/useUJDriver';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

export default function UJDriverPage() {
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
  const [selectedItem, setSelectedItem] = useState<UJDriverItem | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchValue(searchInput.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, isError, error, refetch } = useUJDriverList({
    page,
    per_page: perPage,
    search: searchValue,
    order_by: orderBy,
    order_sort: orderSort,
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePerPageChange = (value: string) => {
    setPerPage(Number(value));
    setPage(1);
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

  const handlePay = (item: UJDriverItem) => {
    setSelectedItem(item);
    setIsPaymentModalOpen(true);
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Linimasa Driver - PT Wajira Transindo</title>
      </Head>

      <div className="space-y-6">
        <PageHeader
          title="Linimasa Driver"
          subtitle="Kelola uang jalan driver dan lain-lain"
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
            {/* Export button can go here if needed, keeping it minimal to avoid adding new unrequested endpoints */}
          </div>

          <UJDriverTable
            data={data?.data ?? []}
            meta={data ?? null}
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

        <UJDriverPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          item={selectedItem}
          companyId={companyNumber}
        />
      </div>
    </DashboardLayout>
  );
}
