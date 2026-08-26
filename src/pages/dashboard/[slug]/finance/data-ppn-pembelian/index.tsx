import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { Search, X } from 'lucide-react';
import { toast } from 'sonner';
import type { PPNPembelian } from '@/types/ppn.types';
import PPNPembelianFormDialog from '@/components/features/ppn-pembelian/PPNPembelianFormDialog';
import PPNPembelianTable from '@/components/features/ppn-pembelian/PPNPembelianTable';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePPNPembelian } from '@/hooks/usePPN';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

export default function DataPPNPembelianPage() {
  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('finance:create');
  const canEdit = hasPermission('finance:edit');
  const canDelete = hasPermission('finance:delete');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('buy_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<PPNPembelian | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const query = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: search || undefined,
      start_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      end_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      sort_by: sortBy,
      sort_direction: sortDirection,
    }),
    [page, perPage, search, dateRange, sortBy, sortDirection],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = usePPNPembelian(query);

  const errorMessage = useMemo(() => {
    if (!error || typeof error !== 'object' || !('message' in error)) {
      return 'Gagal memuat data PPN pembelian';
    }

    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' && message.trim().length > 0 ? message : 'Gagal memuat data PPN pembelian';
  }, [error]);

  useEffect(() => {
    if (isError) {
      toast.error(errorMessage);
    }
  }, [errorMessage, isError]);

  const meta = data?.meta ?? {
    currentPage: page,
    perPage,
    total: 0,
    lastPage: 1,
  };

  useEffect(() => {
    if (data?.isTotalExact && page > data.meta.lastPage) {
      setPage(data.meta.lastPage || 1);
    }
  }, [data?.isTotalExact, data?.meta.lastPage, page]);

  return (
    <DashboardLayout>
      <Head>
        <title>Data PPN Pembelian - Wajira Dashboard</title>
      </Head>

      <div className="space-y-6">
        <PageHeader
          title="Data PPN Pembelian"
          subtitle="Kelola dan lacak semua data PPN pembelian unit langsung dari report backend."
        />

        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap no-print">
            {/* Search Input */}
            <div className="relative w-full sm:w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search here"
                className="pl-9 bg-white"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>

            {/* Date Range Picker */}
            <DatePickerWithRange
              className="w-[240px]"
              date={dateRange}
              onChange={(range) => {
                setDateRange(range);
                setPage(1);
              }}
            />

            {/* Pagination Dropdown */}
            <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
              <span>Show</span>
              <Select
                value={String(perPage)}
                onValueChange={(value) => {
                  setPerPage(Number(value));
                  setPage(1);
                }}
              >
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

            {/* Reset Button */}
            {(searchInput || dateRange) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 px-3 rounded-md text-slate-500 hover:text-red-500 hover:bg-red-50 border border-slate-200 gap-1.5 text-xs font-medium"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setDateRange(undefined);
                  setPage(1);
                }}
              >
                <X className="h-3.5 w-3.5" />
                Reset Filter
              </Button>
            )}
          </div>


          <PPNPembelianTable
            data={data?.data ?? []}
            meta={meta}
            sortBy={sortBy}
            sortDirection={sortDirection}
            hasNextPage={data?.hasNextPage ?? false}
            isTotalExact={data?.isTotalExact ?? false}
            isLoading={isLoading}
            isFetching={isFetching}
            isError={isError}
            errorMessage={errorMessage}
            onRetry={() => void refetch()}
            onPageChange={setPage}
            onSortChange={(nextSortBy) => {
              setPage(1);
              if (nextSortBy === sortBy) {
                setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
                return;
              }

              setSortBy(nextSortBy);
              setSortDirection('asc');
            }}
            onEdit={(item) => {
              setSelected(item);
              setOpenForm(true);
            }}
          />
        </div>

        <PPNPembelianFormDialog
          open={openForm}
          onClose={() => {
            setOpenForm(false);
            setSelected(null);
          }}
          initialData={selected}
        />
      </div>
    </DashboardLayout>
  );
}
