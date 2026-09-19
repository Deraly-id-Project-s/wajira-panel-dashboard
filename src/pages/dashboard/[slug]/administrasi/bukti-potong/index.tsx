import { useEffect, useState } from 'react';
import Head from 'next/head';
import { Plus, Download } from 'lucide-react';
import { useRouter } from 'next/router';
import type { DateRange } from 'react-day-picker';
import type { WithholdingTaxItem } from '@/@types/withholding-tax.types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SearchPagination } from '@/components/ui/search-pagination';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import BuktiPotongTable from '@/components/features/bukti-potong/BuktiPotongTable';
import BuktiPotongDeleteDialog from '@/components/features/bukti-potong/BuktiPotongDeleteDialog';
import { useCompany } from '@/contexts/CompanyContext';
import { useWithholdingTaxes } from '@/hooks/useWithholdingTax';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { fetchUserCompanies } from '@/services/company.service';
import { toast } from 'sonner';

export default function BuktiPotongPage() {
  const { companyId } = useCompany();
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
  const [date, setDate] = useState<DateRange | undefined>();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WithholdingTaxItem | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchValue(searchInput.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const handleDateChange = (next?: DateRange) => {
    setDate(next);
    setPage(1);
  };

  const startDate = date?.from ? date.from.toISOString().split('T')[0] : null;
  const endDate = date?.to ? date.to.toISOString().split('T')[0] : null;

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

  const handleSortChange = (key: string) => {
    if (orderBy === key) {
      setOrderSort(orderSort === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(key);
      setOrderSort('desc');
    }
    setPage(1);
  };

  const handleExport = () => {
    const tableData = data?.data;
    if (!tableData || tableData.length === 0) {
      toast.error('Tidak ada data untuk diexport');
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
    void router.push(base('/administrasi/bukti-potong/create'));
  };

  const handleEdit = (item: WithholdingTaxItem) => {
    void router.push(base(`/administrasi/bukti-potong/${item.id}/edit`));
  };

  const handleView = (item: WithholdingTaxItem) => {
    void router.push(base(`/administrasi/bukti-potong/${item.id}`));
  };

  const handleDelete = (item: WithholdingTaxItem) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Bukti Potong{companyName} - Wajira Dashboard</title>
      </Head>

      <div className="space-y-6">
        <PageHeader
          title="Bukti Potong"
          subtitle="Kelola dan pantau seluruh data bukti potong dengan mudah"
        />

        {/* Tabs for Source Filter */}
        <div className="flex space-x-1 border-b border-slate-200 no-print">
          <button
            type="button"
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              sourceFilter === 'internal'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
            onClick={() => { setSourceFilter('internal'); setPage(1); }}
          >
            Internal
          </button>
          <button
            type="button"
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              sourceFilter === 'external'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
            onClick={() => { setSourceFilter('external'); setPage(1); }}
          >
            Client / Supplier
          </button>
        </div>

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Cari nomor bukti potong..."
          searchAriaLabel="Cari bukti potong"
          filters={
            <DatePickerWithRange
              date={date}
              onChange={handleDateChange}
              placeholder="Pilih rentang tanggal"
              className="w-full sm:w-[260px]"
            />
          }
          page={page}
          perPage={perPage}
          total={data?.meta.total ?? 0}
          lastPage={data?.meta.lastPage ?? 1}
          onPageChange={setPage}
          onPerPageChange={(value) => {
            setPerPage(value);
            setPage(1);
          }}
          actions={
            <>
              <Button onClick={handleExport} variant="outline" className="hover:bg-slate-50 transition-colors">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {canCreate && (
                <Button onClick={handleCreate} className="btn-primary-orange!">
                  <Plus className="h-4 w-4" />
                  Tambah Data
                </Button>
              )}
            </>
          }
        >
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
            onSortChange={handleSortChange}
            currentSortBy={orderBy}
            currentSortDirection={orderSort}
          />
        </SearchPagination>

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