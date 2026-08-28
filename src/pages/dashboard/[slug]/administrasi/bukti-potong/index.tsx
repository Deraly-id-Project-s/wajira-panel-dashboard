import { useEffect, useState } from 'react';
import Head from 'next/head';
import { Search, Plus, Download } from 'lucide-react';
import { useRouter } from 'next/router';
import type { WithholdingTaxItem } from '@/@types/withholding-tax.types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import BuktiPotongTable from '@/components/features/bukti-potong/BuktiPotongTable';
import BuktiPotongDeleteDialog from '@/components/features/bukti-potong/BuktiPotongDeleteDialog';
import { useCompany } from '@/contexts/CompanyContext';
import { useWithholdingTaxes } from '@/hooks/useWithholdingTax';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { fetchUserCompanies } from '@/services/company.service';

export default function BuktiPotongPage() {
  const { companyId } = useCompany();
  // Ensure we use the active companyId.
  const companyNumber = Number(companyId || 4);
  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('finance:create');
  const canEdit = hasPermission('finance:edit');
  const canDelete = hasPermission('finance:delete');
  const [companyName, setCompanyName] = useState('');

  const router = useRouter();
  const slug = router.query.slug as string;
  const base = (path: string) => (slug ? `/dashboard/${slug}${path}` : path);

  useEffect(() => {
    fetchUserCompanies()
      .then((companies) => {
        const found = companies.find((c) => String(c.id) === String(companyId));
        if (found?.name) {
          setCompanyName(` - ${found.name}`);
        }
      })
      .catch(() => undefined);
  }, [companyId]);


  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState('created_at');
  const [orderSort, setOrderSort] = useState<'asc' | 'desc'>('desc');
  const [sourceFilter, setSourceFilter] = useState<'internal' | 'external'>('internal');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WithholdingTaxItem | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchValue(searchInput.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const { data, isLoading: isInitialLoading, isFetching, isError, error, refetch } = useWithholdingTaxes({
    source: sourceFilter,
    company_id: companyNumber,
    page,
    perPage: perPage,
    ...(searchValue ? { withholding_number: searchValue } : {}),
    order_by: orderBy,
    order_dir: orderSort,
    start_date: startDate,
    end_date: endDate,
  });

  const isLoading = isInitialLoading || isFetching;

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
      setOrderSort('desc'); // Default to descending mode when newly sorted
    }
    setPage(1);
  };

  const handleExport = () => {
    const tableData = data?.data;
    if (!tableData || tableData.length === 0) {
      import('sonner').then(m => m.toast.error('Tidak ada data untuk diexport'));
      return;
    }

    const headers = ['No Invoice', 'No Bukti Potong', 'Keterangan PPh', 'Masa Bukpot', 'Nominal PPh', 'Tanggal Dibuat', 'Tanggal Bayar'];
    const rows = tableData.map((item) => [
      item.no_invoice || item.do_invoice?.code || '-',
      item.withholding_number || '-',
      item.pph_description || '-',
      item.withholding_age?.toString() || '-',
      item.pph_amount?.toString() || '0',
      item.created_at || '-',
      item.payment_date || '-'
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bukti-potong-page-${page}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCreate = () => {
    router.push(base('/administrasi/bukti-potong/create'));
  };

  const handleEdit = (item: WithholdingTaxItem) => {
    router.push(base(`/administrasi/bukti-potong/${item.id}/edit`));
  };

  const handleView = (item: WithholdingTaxItem) => {
    router.push(base(`/administrasi/bukti-potong/${item.id}`));
  };

  const handleDelete = (item: WithholdingTaxItem) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Laporan Bukti Potong{companyName}</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Bukti Potong</h1>
          <p className="text-sm text-slate-500">Kelola bukti potong dengan mudah</p>
        </div>

        {/* Tabs for Source Filter */}
        <div className="flex space-x-1 border-b border-slate-200">
          <button
            type="button"
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${sourceFilter === 'internal'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            onClick={() => { setSourceFilter('internal'); setPage(1); }}
          >
            Internal
          </button>
          <button
            type="button"
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${sourceFilter === 'external'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            onClick={() => { setSourceFilter('external'); setPage(1); }}
          >
            Client / Supplier
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center w-full sm:w-auto">
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

              <div className="relative w-full sm:w-[320px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search here"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto hover:bg-slate-50 transition-colors">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {canCreate && (
                <Button onClick={handleCreate} className="btn-primary-orange!">
                  <Plus className="h-4 w-4" />
                  Tambah Data
                </Button>
              )}
            </div>
          </div>

          <BuktiPotongTable
            data={data?.data ?? []}
            meta={data?.meta ?? null}
            isLoading={isLoading}
            isError={isError}
            errorMessage={error ? 'Terjadi kesalahan saat memuat data.' : undefined}
            onRetry={() => refetch()}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPageChange={handlePageChange}
            onSortChange={handleSortChange}
            currentSortBy={orderBy}
            currentSortDirection={orderSort}
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
              setPage(1);
            }}
          />
        </div>

        <BuktiPotongDeleteDialog
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedItem(null);
          }}
          itemId={selectedItem?.id ?? null}
          withholdingNumber={selectedItem?.withholding_number ?? null}
        />
      </div>
    </DashboardLayout>
  );
}
